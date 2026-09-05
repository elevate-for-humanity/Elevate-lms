import 'server-only';

/** Prefer the least-privileged configured server credential. */
export function getStripeRuntimeKey(): string | null {
  for (const value of [process.env.STRIPE_RESTRICTED_KEY, process.env.STRIPE_SECRET_KEY]) {
    const key = value?.trim();
    if (key && (key.startsWith('rk_') || key.startsWith('sk_'))) return key;
  }
  return null;
}

/** Payment mutations require a key with write access. */
export function getStripeWriteKey(): string | null {
  for (const value of [process.env.STRIPE_SECRET_KEY, process.env.STRIPE_RESTRICTED_KEY]) {
    const key = value?.trim();
    if (key && (key.startsWith('sk_') || key.startsWith('rk_'))) return key;
  }
  return null;
}
