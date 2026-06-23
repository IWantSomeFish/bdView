export interface RouteSimilarityModelPayload {
  featureOrder: string[];
  weights: number[];
  labelParams: {
    minSimiliraty: number;
    minCosin: number;
    maxLengthDiff: number;
  };
  trainSampleCount: number;
}

export interface RouteSimilarityModel {
  type: string;
  version: string;
  createdAt: string;
  threshold: number;
  metrics: { f1: number; auc: number };
  payload: RouteSimilarityModelPayload;
}

export interface TrainParams {
  /** Минимальный процент схожести маршрутов в долях */
  minRouteSimiliraty?: number;
  minCosin?: number;
  maxLengthDiffirence?: number;
}

export interface RouteFeatures {
    
    runId: string,
    routeId: string,

    points: string[]
    embeddings: number[][]
}
