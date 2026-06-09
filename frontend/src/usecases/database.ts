import type { IDatabaseRepository } from '../domain/IDatabaseRepository';
import type { ParseResult } from '../domain/types';

const HEALTH_TIMEOUT_MS = 10000;

export async function checkBackendHealth(repo: IDatabaseRepository): Promise<boolean> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Таймаут')), HEALTH_TIMEOUT_MS)
  );
  try {
    await Promise.race([repo.checkHealth(), timeout]);
    return true;
  } catch {
    return false;
  }
}

export async function uploadDatabase(repo: IDatabaseRepository, file: File): Promise<ParseResult> {
  return repo.uploadDatabase(file);
}
