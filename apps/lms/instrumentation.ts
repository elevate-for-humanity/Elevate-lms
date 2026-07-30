export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  try {
    const required = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_ADMIN_URL',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missing = required.filter((name) => {
      const v = process.env[name];
      return !v || !v.trim();
    });

    if (missing.length > 0) {
      console.warn(`[lms] Missing env vars: ${missing.join(', ')}`);
    } else {
      console.info('[lms] Environment validated');
    }
  } catch (error) {
    console.warn('[lms] Environment validation error:', error);
    // Do not crash the server
  }
}
