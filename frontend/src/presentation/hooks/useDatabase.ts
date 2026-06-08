import { useState, useEffect, useCallback } from 'react';
import { databaseRepository } from '../../infrastructure/repositories/DatabaseRepository';
import { checkBackendHealth, uploadDatabase } from '../../usecases/database';
import type { ParseResult } from '../../domain/types';

const POLL_INTERVAL = 5000;

export function useDatabase() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    const online = await checkBackendHealth(databaseRepository);
    setBackendOnline(online);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const data = await uploadDatabase(databaseRepository, file);
      setResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ошибка загрузки файла';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); };

  return { backendOnline, uploading, result, error, upload, reset };
}
