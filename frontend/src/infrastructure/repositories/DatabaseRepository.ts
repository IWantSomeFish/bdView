import { apiClient } from '../http/apiClient';
import type { IDatabaseRepository } from '../../domain/IDatabaseRepository';
import type { ParseResult } from '../../domain/types';

export class DatabaseRepository implements IDatabaseRepository {
  checkHealth(): Promise<void> {
    return apiClient.get('/health').then(() => undefined);
  }

  uploadDatabase(file: File, optimize: boolean): Promise<ParseResult> {
    const formData = new FormData();
    formData.append('database', file);
    formData.append('optimize', String(optimize));
    return apiClient
      .post<ParseResult>('/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  }
}

export const databaseRepository = new DatabaseRepository();
