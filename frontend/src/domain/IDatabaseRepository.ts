import type { ParseResult } from './types';

export interface IDatabaseRepository {
  checkHealth(): Promise<void>;
  uploadDatabase(file: File, optimize: boolean): Promise<ParseResult>;
}
