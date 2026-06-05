import { apiClient } from '../http/apiClient';
import type { ParseResult } from '../../domain/types.ts';

export const checkHealth = (): Promise<void> =>
  apiClient.get('/health').then(() => undefined);

export const uploadDatabase = (file: File): Promise<ParseResult> => {
  const formData = new FormData();
  formData.append('database', file);
  return apiClient
    .post<ParseResult>('/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res: { data: any; }) => res.data);
};
