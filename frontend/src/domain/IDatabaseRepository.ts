import type { ParseResult, SimilarResult } from './types';

export interface IDatabaseRepository {
  checkHealth(): Promise<void>;
  uploadDatabase(file: File): Promise<ParseResult>;
  uploadSimilar(dbFile: File, modelFile: File): Promise<SimilarResult>;
}
