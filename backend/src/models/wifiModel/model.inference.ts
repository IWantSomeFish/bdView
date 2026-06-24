/**
 * Инференс логистического нейрона для фильтрации Wi-Fi сетей.
 * Алгоритм скопирован из основного проекта (job.service.ts).
 *
 * Использование:
 *   import { loadModel, classifyBssid, predictLogistic } from './model.inference';
 *   const model = loadModel(require('../../../wifi-model.json'));
 *   const isStable = classifyBssid('AA:BB:CC:DD:EE:FF', model);
 */

export interface WifiModelPayload {
  featureOrder: string[];
  weights: number[];
  labelParams: {
    minAppearanceFreq: number;
    maxVariance: number;
    minSpatialConsistency: number;
  };
  trainSampleCount: number;
  /** Предвычисленная вероятность для каждого BSSID из обучающего набора */
  bssidProbability: Record<string, number>;
}

export interface WifiModel {
  type: string;
  version: string;
  createdAt: string;
  threshold: number;
  metrics: { f1: number; auc: number };
  payload: WifiModelPayload;
}

/**
 * Загружает и валидирует модель из JSON-объекта.
 * Передай результат require('./wifi-model.json') или fetch+json().
 */
export function loadModel(raw: unknown): WifiModel {
  const m = raw as WifiModel;
  if (!m?.payload?.weights || !m?.payload?.bssidProbability) {
    throw new Error('Невалидный файл модели: отсутствуют weights или bssidProbability');
  }
  return m;
}

/**
 * Сигмоида + скалярное произведение весов и признаков.
 * weights[0] = bias, weights[1..n] = веса признаков.
 */
export function predictLogistic(features: number[], weights: number[]): number {
  let z = weights[0];
  for (let i = 0; i < features.length; i++) {
    z += weights[i + 1] * features[i];
  }
  return 1 / (1 + Math.exp(-z));
}

/**
 * Классифицировать BSSID по предвычисленной таблице вероятностей.
 * Быстрый путь: O(1), не пересчитывает признаки.
 * Возвращает true = сеть стабильная (оставить), false = нестабильная (убрать).
 */
export function classifyBssid(bssid: string, model: WifiModel): boolean {
  const prob = model.payload.bssidProbability[bssid] ?? 0;
  return prob >= model.threshold;
}

/**
 * Классифицировать BSSID по признакам на лету (если BSSID нет в таблице).
 * Медленнее, чем classifyBssid, но работает для новых сетей.
 *
 * features = {
 *   appearanceFrequency: доля прогонов, видевших эту сеть (0..1),
 *   avgSignalNorm:       (avgSignalDbm + 100) / 100,
 *   signalVarianceNorm:  min(1, variance / 100),
 *   spatialConsistency:  1 / (1 + (std(lat) + std(lon)) * 5000)
 * }
 */
export function classifyBssidFromFeatures(
  features: Record<string, number>,
  model: WifiModel
): boolean {
  const vec = model.payload.featureOrder.map((f) => features[f] ?? 0);
  const prob = predictLogistic(vec, model.payload.weights);
  return prob >= model.threshold;
}

/**
 * Отфильтровать массив BSSID, вернув только стабильные.
 */
export function filterStableNetworks(
  bssids: string[],
  model: WifiModel
): string[] {
  return bssids.filter((bssid) => classifyBssid(bssid, model));
}
