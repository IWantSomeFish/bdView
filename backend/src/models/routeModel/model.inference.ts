import { RouteSimilarityModel } from "./model.types";

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

export function modelInference(model: RouteSimilarityModel, features: number[]): boolean {
    const prediction = predictLogistic(features, model.payload.weights)
    if (prediction < model.threshold) {
        return false
    }
    return true
}