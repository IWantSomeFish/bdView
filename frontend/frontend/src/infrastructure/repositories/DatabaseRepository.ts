import { apiClient } from '../http/apiClient';
import type { IDatabaseRepository } from '../../domain/IDatabaseRepository';
import type { ParseResult, SimilarResult } from '../../domain/types';

export class DatabaseRepository implements IDatabaseRepository {
  checkHealth(): Promise<void> {
    return apiClient.get('/health').then(() => undefined);
  }

  uploadDatabase(file: File): Promise<ParseResult> {
    const formData = new FormData();
    formData.append('database', file);
    return apiClient
      .post<ParseResult>('/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  }

  uploadSimilar(file: File): Promise<SimilarResult> {
    const formData = new FormData();
    formData.append('database', file);
    return apiClient
      .post<SimilarResult>('/similar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  }
}

export const databaseRepository = new DatabaseRepository();
