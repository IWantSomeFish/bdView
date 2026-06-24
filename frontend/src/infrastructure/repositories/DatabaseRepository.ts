import { apiClient } from '../http/apiClient';
import type { IDatabaseRepository } from '../../domain/IDatabaseRepository';
import type { ParseResult, SimilarResult, InferenceRequest, InferenceResult } from '../../domain/types';

export class DatabaseRepository implements IDatabaseRepository {
  checkHealth(): Promise<void> {
    return apiClient.get('/health').then(() => undefined);
  }

  uploadDatabase(file: File): Promise<ParseResult> {
    const formData = new FormData();
    formData.append('database', file);
    return apiClient
      .post<ParseResult>('/route/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  }

  uploadSimilar(dbFile: File, modelFile: File): Promise<SimilarResult> {
    const formData = new FormData();
    formData.append('databaseFile', dbFile);
    formData.append('modelFile', modelFile);
    return apiClient
      .post<SimilarResult>('/route/inference', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  }

  infer(request: InferenceRequest): Promise<InferenceResult> {
    const formData = new FormData();
    if (request.dbFile) formData.append('databaseFile', request.dbFile);
    if (request.modelFile) formData.append('modelFile', request.modelFile);
    return apiClient
      .post<InferenceResult>(`/${request.modelType === 'wifi_filter' ? 'wifi' : 'route'}/inference`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  }
}

export const databaseRepository = new DatabaseRepository();
