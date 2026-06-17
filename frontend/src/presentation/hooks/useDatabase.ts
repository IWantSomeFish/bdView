import { useState, useEffect, useCallback } from 'react';
import { databaseRepository } from '../../infrastructure/repositories/DatabaseRepository';
import { checkBackendHealth, uploadDatabase, uploadSimilar } from '../../usecases/database';
import type { ParseResult, SimilarResult } from '../../domain/types';

export function useDatabase() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [similarResult, setSimilarResult] = useState<SimilarResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    const online = await checkBackendHealth(databaseRepository);
    setBackendOnline(online);
    return online;
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setSimilarResult(null);
    const online = await checkHealth();
    if (!online) {
      setError('Backend недоступен');
      setUploading(false);
      return;
    }
    try {
      const data = await uploadDatabase(databaseRepository, file);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const similar = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setSimilarResult(null);
    const online = await checkHealth();
    if (!online) {
      setError('Backend недоступен');
      setUploading(false);
      return;
    }
    try {
      const data = await uploadSimilar(databaseRepository, file);
      setSimilarResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка анализа похожих маршрутов');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setResult(null); setSimilarResult(null); setError(null); };

  return { backendOnline, uploading, result, similarResult, error, upload, similar, reset };
}
