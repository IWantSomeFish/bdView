import type { ParseResult, SimilarResult } from './types';

export interface IDatabaseRepository {
  checkHealth(): Promise<void>;
  uploadDatabase(file: File): Promise<ParseResult>;
  uploadSimilar(file: File): Promise<SimilarResult>;
}
