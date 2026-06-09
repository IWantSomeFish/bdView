import { useState, useEffect, useCallback } from 'react';
import { databaseRepository } from '../../infrastructure/repositories/DatabaseRepository';
import { checkBackendHealth, uploadDatabase } from '../../usecases/database';
import type { ParseResult } from '../../domain/types';

const SESSION_KEY = 'db_parse_result';

function loadFromSession(): ParseResult | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ParseResult) : null;
  } catch {
    return null;
  }
}

function saveToSession(data: ParseResult) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage может быть переполнен для больших БД
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function useDatabase() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(loadFromSession);
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
    clearSession();
    if (!backendOnline) {
      const online = await checkBackendHealth(databaseRepository);
      setBackendOnline(online);
      if (!online) {
        setError('Backend недоступен');
        setUploading(false);
        return;
      }
    }
    try {
      const data = await uploadDatabase(databaseRepository, file);
      setResult(data);
      saveToSession(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Ошибка загрузки файла';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setResult(null); setError(null); clearSession(); };

  return { backendOnline, uploading, result, error, upload, reset };
}
