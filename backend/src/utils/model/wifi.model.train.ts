/**
 * Обучение логистического нейрона для фильтрации Wi-Fi сетей.
 * Алгоритм скопирован из основного проекта (job.service.ts, метод trainModel).
 *
 * Использование:
 *   import { trainWifiModel } from './model.train';
 *
 *   const scans = [
 *     { bssid: 'AA:BB:...', signal: -65, latitude: 55.123, longitude: 37.456, runId: 'run-1' },
 *     ...
 *   ];
 *   const model = trainWifiModel(scans);
 *   // model можно сохранить как JSON и использовать через model.inference.ts
 */

import { WifiModel } from './wifi.model.inference';

export interface ScanRow {
  bssid: string;
  signal: number;
  latitude: number;
  longitude: number;
  runId: string;
}

export interface TrainParams {
  /** Минимальная доля прогонов, видевших сеть (0..1). По умолчанию 0.5 */
  minAppearanceFreq?: number;
  /** Максимальная дисперсия сигнала. По умолчанию 120 */
  maxVariance?: number;
  /** Минимальная пространственная консистентность (0..1). По умолчанию 0.35 */
  minSpatialConsistency?: number;
}

// ─── внутренние функции (перенесены из job.service.ts) ───────────────────────

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, v) => a + v, 0) / values.length;
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function predictLogistic(features: number[], weights: number[]): number {
  let z = weights[0];
  for (let i = 0; i < features.length; i++) {
    z += weights[i + 1] * features[i];
  }
  return 1 / (1 + Math.exp(-z));
}

function trainLogisticNeuron(dataset: Array<{ features: number[]; label: number }>): number[] {
  const featureCount = dataset[0].features.length;
  const weights = new Array(featureCount + 1).fill(0);
  const learningRate = 0.05;
  const epochs = 160;
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (const sample of dataset) {
      const yHat = predictLogistic(sample.features, weights);
      const err = yHat - sample.label;
      weights[0] -= learningRate * err;
      for (let i = 0; i < featureCount; i++) {
        weights[i + 1] -= learningRate * err * sample.features[i];
      }
    }
  }
  return weights;
}

function evaluateLogistic(
  dataset: Array<{ features: number[]; label: number }>,
  weights: number[],
  threshold = 0.5
): { f1: number; auc: number } {
  let tp = 0, fp = 0, fn = 0;
  for (const sample of dataset) {
    const pred = predictLogistic(sample.features, weights) >= threshold ? 1 : 0;
    if (pred === 1 && sample.label === 1) tp++;
    if (pred === 1 && sample.label === 0) fp++;
    if (pred === 0 && sample.label === 1) fn++;
  }
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    f1: Number(f1.toFixed(4)),
    auc: Number(Math.max(0.5, Math.min(1, 0.5 + f1 / 2)).toFixed(4))
  };
}

// Стабильные сети редкий класс, поэтому порог 0.5 почти никогда не срабатывает.
// Перебираем все уникальные предсказанные значения и берём тот, где F1 максимален.
function findBestThreshold(
  dataset: Array<{ features: number[]; label: number }>,
  weights: number[]
): number {
  const predictions = dataset.map((s) => predictLogistic(s.features, weights));
  const candidates = Array.from(new Set(predictions)).sort((a, b) => a - b);
  if (candidates.length === 0) return 0.5;
  let bestThreshold = 0.5;
  let bestF1 = -1;
  for (const candidate of candidates) {
    let tp = 0, fp = 0, fn = 0;
    for (let i = 0; i < dataset.length; i++) {
      const pred = predictions[i] >= candidate ? 1 : 0;
      if (pred === 1 && dataset[i].label === 1) tp++;
      if (pred === 1 && dataset[i].label === 0) fp++;
      if (pred === 0 && dataset[i].label === 1) fn++;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    if (f1 > bestF1) {
      bestF1 = f1;
      bestThreshold = candidate;
    }
  }
  return bestThreshold;
}

// ─── публичный API ────────────────────────────────────────────────────────────

/**
 * Обучить модель по набору Wi-Fi сканов.
 *
 * @param scans  Массив строк: каждый скан = одно наблюдение одной сети в одном прогоне
 * @param params Параметры разметки (пороги эвристики). Опциональны, есть дефолты.
 * @returns      Готовый объект WifiModel, совместимый с model.inference.ts
 */
export function trainWifiModel(scans: ScanRow[], params: TrainParams = {}): WifiModel {
  if (scans.length < 50) {
    throw new Error(`Слишком мало сканов для обучения: ${scans.length} (нужно >= 50)`);
  }

  const minFreq  = params.minAppearanceFreq    ?? 0.5;
  const maxVar   = params.maxVariance           ?? 120;
  const minSpat  = params.minSpatialConsistency ?? 0.35;

  // ── шаг 1: группировка по BSSID ──────────────────────────────────────────
  const grouped = new Map<string, {
    count: number;
    signalSum: number;
    signalSqSum: number;
    lat: number[];
    lon: number[];
    runIds: Set<string>;
  }>();

  for (const row of scans) {
    const cur = grouped.get(row.bssid) ?? {
      count: 0, signalSum: 0, signalSqSum: 0, lat: [], lon: [], runIds: new Set<string>()
    };
    cur.count++;
    cur.signalSum    += row.signal;
    cur.signalSqSum  += row.signal * row.signal;
    cur.lat.push(row.latitude);
    cur.lon.push(row.longitude);
    cur.runIds.add(row.runId);
    grouped.set(row.bssid, cur);
  }

  const totalRuns = new Set(scans.map((r) => r.runId)).size;

  // ── шаг 2: вычисление 4 признаков + авторазметка ─────────────────────────
  const featureRows: Array<{ bssid: string; features: number[]; label: number }> = [];

  for (const [bssid, stat] of grouped.entries()) {
    if (stat.count < 3) continue;

    // Доля прогонов, видевших эту сеть (не зависит от длины маршрута)
    const appearanceFrequency = stat.runIds.size / Math.max(1, totalRuns);
    const avgSignal   = stat.signalSum / stat.count;
    const variance    = Math.max(0, stat.signalSqSum / stat.count - avgSignal * avgSignal);
    const spatialSpread     = std(stat.lat) + std(stat.lon);
    const spatialConsistency = 1 / (1 + spatialSpread * 5000);

    const features = [
      appearanceFrequency,
      (avgSignal + 100) / 100,       // нормализация dBm → [0..1]
      Math.min(1, variance / 100),
      Math.max(0, Math.min(1, spatialConsistency))
    ];

    // Эвристика-учитель: ставит метку 1, если сеть выглядит стационарной
    const label =
      appearanceFrequency >= minFreq &&
      variance             <= maxVar  &&
      spatialConsistency  >= minSpat  ? 1 : 0;

    featureRows.push({ bssid, features, label });
  }

  if (featureRows.length < 20) {
    throw new Error(`Недостаточно уникальных BSSID для обучения: ${featureRows.length} (нужно >= 20)`);
  }

  // ── шаг 3: разбивка train/validation 80/20 ───────────────────────────────
  const trainSize  = Math.max(1, Math.floor(featureRows.length * 0.8));
  const trainSet   = featureRows.slice(0, trainSize);
  const valSet     = featureRows.slice(trainSize);

  // ── шаг 4: обучение (SGD, 160 эпох) ─────────────────────────────────────
  const weights = trainLogisticNeuron(
    trainSet.map((x) => ({ features: x.features, label: x.label }))
  );

  // ── шаг 5: подбор порога ─────────────────────────────────────────────────
  // Если в validation нет ни одного label=1 (редкий класс), используем train
  const evalSet = valSet.length > 0 && valSet.some((x) => x.label === 1) ? valSet : trainSet;
  const evalData = evalSet.map((x) => ({ features: x.features, label: x.label }));
  const threshold = findBestThreshold(evalData, weights);
  const metrics   = evaluateLogistic(evalData, weights, threshold);

  // ── шаг 6: предвычислить вероятности для всех BSSID ──────────────────────
  const bssidProbability: Record<string, number> = {};
  for (const row of featureRows) {
    bssidProbability[row.bssid] = Number(
      predictLogistic(row.features, weights).toFixed(4)
    );
  }

  const version = `trained-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-5)}`;

  return {
    type: 'consensus_neural_filter',
    version,
    createdAt: new Date().toISOString().slice(0, 10),
    threshold,
    metrics,
    payload: {
      featureOrder: ['appearanceFrequency', 'avgSignalNorm', 'signalVarianceNorm', 'spatialConsistency'],
      weights,
      labelParams: { minAppearanceFreq: minFreq, maxVariance: maxVar, minSpatialConsistency: minSpat },
      trainSampleCount: trainSet.length,
      bssidProbability
    }
  };
}

/**
 * Сериализовать модель в JSON-строку (для сохранения в файл или ответа API).
 */
export function serializeModel(model: WifiModel): string {
  return JSON.stringify(model, null, 2);
}
