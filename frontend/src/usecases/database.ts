import type { IDatabaseRepository } from '../domain/IDatabaseRepository';
import type { ParseResult } from '../domain/types';

export async function checkBackendHealth(repo: IDatabaseRepository): Promise<boolean> {
  try {
    await repo.checkHealth();
    return true;
  } catch {
    return false;
  }
}

export async function uploadDatabase(repo: IDatabaseRepository, file: File): Promise<ParseResult> {
  return repo.uploadDatabase(file);
}
