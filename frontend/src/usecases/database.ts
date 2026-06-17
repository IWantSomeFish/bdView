import type { IDatabaseRepository } from '../domain/IDatabaseRepository';
import type { ParseResult, SimilarResult } from '../domain/types';

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

export async function uploadSimilar(repo: IDatabaseRepository, file: File): Promise<SimilarResult> {
  return repo.uploadSimilar(file);
}
