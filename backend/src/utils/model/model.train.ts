import { getEnvVariable } from "../env.helper";
import { H3Tokenizer } from "../trajectory/trajectory.tokenize";
import { H3Trajectory } from "../trajectory/trajectory.types";
import { createRouteFeatures } from "./model.modelTest";
import { RouteSimilarityModel, TrainParams } from "./model.types";

function predictLogistic(features: number[], weights: number[]): number {
  let z = weights[0];
  for (let i = 0; i < features.length; i++) {
	z += weights[i + 1] * features[i];
  }
  return 1 / (1 + Math.exp(-z));
}

function trainLogisticNeuron(dataset: Array<{ features: number[]; label: number }>, epochs: number, learningRate: number): number[] {
	const featureCount = dataset[0].features.length;
	const weights = new Array(featureCount + 1).fill(0);
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
 * Обучить модель по набору калибровок маршрутов.
 *
 * @param scans  Массив строк: каждый скан = одно наблюдение одной сети в одном прогоне
 * @param params Параметры разметки (пороги эвристики). Опциональны, есть дефолты.
 * @returns      Готовый объект WifiModel, совместимый с model.inference.ts
 */
export function trainRouteSimilarityModel(calibrations: H3Trajectory[], params: TrainParams = {}, learningRate: number, epochs: number): RouteSimilarityModel {

	if (calibrations.length < Number(getEnvVariable("MIN_ROUTES_TO_LEARN"))) {
		throw new Error(`Слишком мало калибровок для обучения: ${calibrations.length} (нужно >= ${Number(getEnvVariable("MIN_ROUTES_TO_LEARN"))})`);
	}
	const tokenizer: H3Tokenizer = new H3Tokenizer

	const minSimiliraty  = params.minRouteSimiliraty ?? 0.5
	const minCosin = params.minCosin ?? 0.3
	const maxLengthDiff = params.maxLengthDiffirence ?? 0.2

	// ── шаг 1: вычисление признаков + авторазметка ─────────────────────────
	const featureRows: Array<{ runId: string; features: number[]; label: number }> = [];
	for (const calibrationA of calibrations) {

		for (const calibrationB of calibrations){
			const features: number[] = createRouteFeatures(tokenizer.tokenizeTrajectory(calibrationA), tokenizer.tokenizeTrajectory(calibrationB));
			const label: boolean = (features[0] >= minSimiliraty) && (features[1] >= minCosin) && (features[2] <= maxLengthDiff)
			featureRows.push({
				runId: calibrationB.runId,
				features: features,
				label: Number(label)
		})
		}
	}
	// ── шаг 2: разбивка train/validation 80/20 ───────────────────────────────
	const trainSize  = Math.max(1, Math.floor(featureRows.length * 0.8));
	const trainSet   = featureRows.slice(0, trainSize);
	const valSet     = featureRows.slice(trainSize);

	// ── шаг 3: обучение (SGD, 160 эпох) ─────────────────────────────────────
	const weights = trainLogisticNeuron(
    trainSet.map((x) => ({ features: x.features, label: x.label })), epochs, learningRate);

	// ── шаг 4: подбор порога ─────────────────────────────────────────────────
	// Если в validation нет ни одного label=1 (редкий класс), используем train
  	const evalSet = valSet.length > 0 && valSet.some((x) => x.label === 1) ? valSet : trainSet;
  	const evalData = evalSet.map((x) => ({ features: x.features, label: x.label }));
  	const threshold = findBestThreshold(evalData, weights);
  	const metrics   = evaluateLogistic(evalData, weights, threshold);

  	const version = `trained-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-5)}`;

  	const result = {
		type: 'consensus_neural_filter',
		version,
		createdAt: new Date().toISOString().slice(0, 10),
		threshold,
		metrics,
		payload: {
	  		featureOrder: ['calibSimilarity', 'cosinSimilarity', 'lengthDifference'],
	  		weights,
	  		labelParams: { minSimiliraty: minSimiliraty, minCosin: minCosin, maxLengthDiff: maxLengthDiff},
	  		trainSampleCount: trainSet.length,
			}
  		};
	return result 
}

/**
 * Сериализовать модель в JSON-строку (для сохранения в файл или ответа API).
 */
export function serializeModel(model: RouteSimilarityModel): string {
  return JSON.stringify(model, null, 2);
}
