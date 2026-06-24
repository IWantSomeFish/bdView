import type { IDatabaseRepository } from '../domain/IDatabaseRepository';
import type { InferenceRequest, InferenceResult } from '../domain/types';

export async function runInference(
  repo: IDatabaseRepository,
  request: InferenceRequest
): Promise<InferenceResult> {
  return repo.infer(request);
}
