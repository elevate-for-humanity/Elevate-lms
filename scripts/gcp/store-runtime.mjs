import { validateConfig } from './runtime-config.mjs';

// Store's source service was excluded from the shared production environment.
// Resolve only its missing database connection from an already Google-owned
// component. Do not inherit Marketing's provider, billing or administrator keys.
export function resolveStoreDatabase(store, shared) {
  validateConfig(store, 'store'); validateConfig(shared, 'marketing');
  const expected = 'https://cuxzzpsyufcewtmicszk.supabase.co';
  if (shared.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL !== expected ||
      (store.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL && store.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL !== expected))
    throw new Error('Unexpected Store database tenant');
  const runtimeEnvironment = { ...store.runtimeEnvironment };
  for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!runtimeEnvironment[key]) {
      if (!shared.runtimeEnvironment[key]) throw new Error('Google-owned Store database configuration incomplete');
      runtimeEnvironment[key] = shared.runtimeEnvironment[key];
    }
  }
  return { ...store, runtimeEnvironment };
}
