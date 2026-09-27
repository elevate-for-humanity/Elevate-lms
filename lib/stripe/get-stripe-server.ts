import 'server-only';

// Compatibility boundary: old webhook handlers must fail closed. The retired
// provider SDK is intentionally absent from production dependencies.
export async function getStripeServer(): Promise<null> {
  return null;
}
