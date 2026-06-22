import { useState, useEffect, useCallback } from 'react';
import { databaseRepository } from '../../infrastructure/repositories/DatabaseRepository';
import { checkBackendHealth, loadRoutes, findSimilarRoutes } from '../../usecases/database';
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
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setSimilarResult(null);
    try {
      const data = await loadRoutes(databaseRepository, file);
      setResult(data);
      setBackendOnline(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки файла';
      setError(message);
      if (message === 'Backend недоступен') setBackendOnline(false);
    } finally {
      setUploading(false);
    }
  };

  const similar = async (dbFile: File, modelFile: File) => {
    setUploading(true);
    setError(null);
    setSimilarResult(null);
    try {
      const [parseData, similarData] = await Promise.all([
        result ? Promise.resolve(result) : loadRoutes(databaseRepository, dbFile),
        findSimilarRoutes(databaseRepository, dbFile, modelFile),
      ]);
      setResult(parseData);
      setSimilarResult(similarData);
      setBackendOnline(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка анализа похожих маршрутов';
      setError(message);
      if (message === 'Backend недоступен') setBackendOnline(false);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setResult(null); setSimilarResult(null); setError(null); };

  return { backendOnline, uploading, result, similarResult, error, upload, similar, reset };
}
