import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Northflank Health Check Endpoint - Admin Service
 * 
 * Confirms the application is alive and can serve requests.
 * Returns diagnostics for environment variables to troubleshoot configuration issues.
 */
export async function GET() {
  const checkEnv = (key: string) => {
    const val = process.env[key];
    return {
      present: !!val,
      length: val ? val.length : 0,
      isPlaceholder: val === 'placeholder' || val === 'build-placeholder',
    };
  };

  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'elevate-admin',
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || '8080 (default)',
    env_diagnostics: {
      SUPABASE_URL: checkEnv('NEXT_PUBLIC_SUPABASE_URL'),
      SUPABASE_ANON_KEY: checkEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      SUPABASE_SERVICE_ROLE_KEY: checkEnv('SUPABASE_SERVICE_ROLE_KEY'),
      STRIPE_SECRET_KEY: checkEnv('STRIPE_SECRET_KEY'),
      SSN_SALT: checkEnv('SSN_SALT'),
    }
  };

  return NextResponse.json(status, { status: 200 });
}
