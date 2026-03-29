export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load runtime secrets from Supabase into process.env.
    // Keeps only 3 bootstrap vars in Netlify env (under Lambda 4 KB limit).
    const { hydrateProcessEnv } = await import('./lib/secrets');
    await hydrateProcessEnv();

    // Only load Sentry when a DSN is configured — avoids crashing dev servers
    // that don't have @sentry/node-core resolved in the pnpm isolated store.
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.server.config');
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.edge.config');
    }
  }
}
