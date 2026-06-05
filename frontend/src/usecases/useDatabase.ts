import { useState, useEffect } from 'react';
import { checkHealth, uploadDatabase } from '../infrastructure/repositories/databaseRepository';
import type { ParseResult } from '../domain/types.ts';

export function useDatabase() {
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const data = await uploadDatabase(file);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  return { backendOnline, uploading, result, error, upload };
}
