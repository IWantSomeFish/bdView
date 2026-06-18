# Нейронная модель фильтрации Wi-Fi сетей

## Что это такое

Логистический нейрон — однослойная нейронная сеть, которая по четырём признакам Wi-Fi сети
определяет, является ли она **стабильной стационарной точкой** (стоит как ориентир для маршрута)
или **нестабильной** (мобильные точки доступа, помехи, временные сети).

Реализована вручную без TensorFlow или ML-библиотек. Алгоритм взят из основного проекта
(файл `job.service.ts`, методы `trainLogisticNeuron` и `predictLogistic`).

---

## Файлы

| Файл | Назначение |
|------|-----------|
| `wifi-model.json` | Предобученная модель (1258 BSSID из реального проекта) |
| `src/utils/model/model.inference.ts` | Загрузка модели и предсказания |
| `src/utils/model/model.train.ts` | Обучение новой модели на своих данных |

---

## Структура файла модели (`wifi-model.json`)

```json
{
  "type": "consensus_neural_filter",
  "version": "19",
  "createdAt": "2026-06-18",
  "threshold": 0.677,
  "metrics": { "f1": 1, "auc": 1 },
  "payload": {
    "featureOrder": ["appearanceFrequency", "avgSignalNorm", "signalVarianceNorm", "spatialConsistency"],
    "weights": [-12.14, 22.73, -3.26, -2.85, 4.55],
    "labelParams": { "minAppearanceFreq": 0.5, "maxVariance": 120, "minSpatialConsistency": 0.35 },
    "trainSampleCount": 1006,
    "bssidProbability": { "AA:BB:CC:DD:EE:FF": 0.9935, ... }
  }
}
```

### Поля

- **`weights`** — 5 чисел: `[bias, w_freq, w_signal, w_variance, w_spatial]`
- **`threshold`** — порог вероятности. Если `σ(z) >= threshold` → сеть стабильная
- **`bssidProbability`** — предвычисленная таблица `{ bssid → вероятность }` для 1258 сетей
- **`labelParams`** — параметры эвристики, которой размечали обучающий набор

---

## Как работает обучение (в основном проекте)

```
1. Загрузить все Wi-Fi сканы из прогонов маршрута

2. Сгруппировать по BSSID, вычислить 4 признака:
   ┌─────────────────────────────────────────────────────────────────────┐
   │ appearanceFrequency = кол-во прогонов, видевших BSSID / всего прогонов
   │ avgSignalNorm       = (среднийСигналДБм + 100) / 100
   │ signalVarianceNorm  = min(1, дисперсияСигнала / 100)
   │ spatialConsistency  = 1 / (1 + (std(lat) + std(lon)) × 5000)
   └─────────────────────────────────────────────────────────────────────┘

3. Авторазметка эвристикой (label 0 или 1):
   label = freq >= 0.5  AND  variance <= 120  AND  spatial >= 0.35
           ?  1 (стабильная)
           :  0 (нестабильная)

4. Обучение: градиентный спуск (SGD), 160 эпох, lr = 0.05
   для каждой эпохи:
     yHat = sigmoid(bias + w1*f1 + w2*f2 + w3*f3 + w4*f4)
     err  = yHat - label
     weights -= lr * err * features

5. Подбор порога: перебор значений 0.01..0.99, выбирается тот, что даёт максимальный F1

6. Вычислить sigmoid для ВСЕХ BSSID и сохранить в bssidProbability
```

---

## Как работает инференс (предсказание)

Два варианта — оба реализованы в `model.inference.ts`:

### Вариант А — быстрый (O(1), по таблице)

Использовать, когда BSSID есть в обучающем наборе:

```typescript
import { loadModel, classifyBssid } from './src/utils/model/model.inference';
import * as modelJson from './wifi-model.json';

const model = loadModel(modelJson);

// true = оставить, false = убрать
const isStable = classifyBssid('44:f7:70:ba:ad:06', model);
```

### Вариант Б — по признакам (для новых сетей)

Использовать, когда BSSID не встречался в обучении:

```typescript
const isStable = classifyBssidFromFeatures({
  appearanceFrequency: 0.8,
  avgSignalNorm: 0.45,      // (-55 dBm + 100) / 100
  signalVarianceNorm: 0.12,
  spatialConsistency: 0.72
}, model);
```

### Математика предсказания

```
z    = w0 + w1*f1 + w2*f2 + w3*f3 + w4*f4
prob = 1 / (1 + e^(-z))          ← сигмоида
kept = prob >= threshold
```

---

## Подключение в groups.service.ts

```typescript
import { loadModel, classifyBssid } from '../utils/model/model.inference';
import * as modelJson from '../../wifi-model.json';

export class CalibrationGroupingService {
  private model = loadModel(modelJson);

  private isStableNetwork(bssid: string): boolean {
    return classifyBssid(bssid, this.model);
  }

  // Вызвать isStableNetwork() перед вычислением сходства
  // чтобы нестабильные сети не искажали Жаккар
}
```

---

---

## Самостоятельное обучение (`model.train.ts`)

Если хочется обучить модель на своих данных (из загруженной БД):

```typescript
import { trainWifiModel, serializeModel, ScanRow } from './src/utils/model/model.train';
import * as fs from 'fs';

// scans — массив Wi-Fi сканов из твоей базы
// каждый элемент: { bssid, signal, latitude, longitude, runId }
const scans: ScanRow[] = getScansFromDb(); // твой запрос к SQLite

const model = trainWifiModel(scans, {
  minAppearanceFreq:    0.5,   // сеть должна встречаться хотя бы в 50% прогонов
  maxVariance:          120,   // дисперсия сигнала не выше 120
  minSpatialConsistency: 0.35  // разброс координат не выше ~180м
});

// сохранить как файл
fs.writeFileSync('./wifi-model.json', serializeModel(model));
console.log('Обучено:', model.metrics, 'версия:', model.version);
```

После обучения `wifi-model.json` перезапишется и будет содержать новые веса и `bssidProbability`
для сетей из твоей базы. Дальше `model.inference.ts` использует его без изменений.

### Что происходит внутри `trainWifiModel`

```
scans (массив строк)
  │
  ▼
группировка по BSSID
  → count, signalSum, signalSqSum, lat[], lon[], runIds
  │
  ▼
4 признака на каждый BSSID:
  appearanceFrequency  = кол-во прогонов, видевших сеть / всего прогонов
  avgSignalNorm        = (средний сигнал + 100) / 100
  signalVarianceNorm   = min(1, дисперсия / 100)
  spatialConsistency   = 1 / (1 + (std(lat) + std(lon)) × 5000)
  │
  ▼
авторазметка (эвристика-учитель):
  label = freq >= 0.5 AND variance <= 120 AND spatial >= 0.35 ? 1 : 0
  │
  ▼
SGD, 160 эпох, lr = 0.05
  → weights[bias, w1, w2, w3, w4]
  │
  ▼
findBestThreshold (перебор F1)
  │
  ▼
предвычислить bssidProbability для всех BSSID
  │
  ▼
вернуть WifiModel { weights, threshold, bssidProbability, metrics }
```

---

## Почему логистическая регрессия, а не нейросеть?

Признаков всего 4. При 4 признаках:
- MLP (многослойная сеть) переобучится или даст тот же результат, что и линейная граница
- Логистический нейрон считает предсказание за **~10 наносекунд**
- Нет зависимости от TensorFlow (500 МБ) — проект развёртывается на любом сервере

Если в будущем добавятся новые признаки (день недели, тип SSID, плотность застройки),
достаточно дообучить модель — формат JSON не изменится.
