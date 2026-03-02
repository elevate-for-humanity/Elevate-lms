export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Load runtime secrets from Supabase into process.env.
    // Keeps only 3 bootstrap vars in Netlify env (under Lambda 4 KB limit).
    const { hydrateProcessEnv } = await import('./lib/secrets');
    await hydrateProcessEnv();

    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
