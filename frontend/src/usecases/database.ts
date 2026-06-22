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

export async function loadRoutes(repo: IDatabaseRepository, file: File): Promise<ParseResult> {
  const online = await checkBackendHealth(repo);
  if (!online) throw new Error('Backend недоступен');
  return repo.uploadDatabase(file);
}

export async function findSimilarRoutes(repo: IDatabaseRepository, dbFile: File, modelFile: File): Promise<SimilarResult> {
  const online = await checkBackendHealth(repo);
  if (!online) throw new Error('Backend недоступен');
  return repo.uploadSimilar(dbFile, modelFile);
}
