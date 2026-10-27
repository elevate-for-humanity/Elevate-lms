import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';

type PaidInferenceContext = { requestId: string };

const paidInferenceContext = new AsyncLocalStorage<PaidInferenceContext>();

export function runWithPaidInferenceContext<T>(requestId: string, operation: () => Promise<T>) {
  return paidInferenceContext.run({ requestId }, operation);
}

export function requirePaidInferenceContext(operation: string): string {
  const context = paidInferenceContext.getStore();
  if (!context?.requestId) {
    throw new Error(`PAID_INFERENCE_AUTHORIZATION_REQUIRED:${operation}`);
  }
  return context.requestId;
}
