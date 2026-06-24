import type { ParseResult, SimilarResult, InferenceRequest, InferenceResult } from './types';

export interface IDatabaseRepository {
  checkHealth(): Promise<void>;
  uploadDatabase(file: File): Promise<ParseResult>;
  uploadSimilar(dbFile: File, modelFile: File): Promise<SimilarResult>;
  infer(request: InferenceRequest): Promise<InferenceResult>;
}
