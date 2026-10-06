import { availableParallelism } from 'node:os';

export function renderConcurrency(requested = process.env.REMOTION_RENDER_CONCURRENCY, available = availableParallelism()) {
  const limit = Math.max(1, Math.min(4, Math.floor(available)));
  if (requested === undefined || requested === '') return Math.min(2, limit);
  if (!/^[1-4]$/.test(requested)) throw new Error('REMOTION_RENDER_CONCURRENCY_MUST_BE_1_TO_4');
  return Math.min(Number(requested), limit);
}
