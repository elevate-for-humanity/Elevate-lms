import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Northflank Health Check Endpoint
 * 
 * Confirms the application is alive and can serve requests.
 * Used by Northflank to determine container readiness.
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
    service: 'elevate-lms',
    node_env: process.env.NODE_ENV,
    port: process.env.PORT || '3000 (default)',
    build_identity: {
      commit_sha: process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.GIT_SHA || process.env.GITHUB_SHA || 'dev-local',
      build_time: process.env.BUILD_TIMESTAMP || 'unknown',
    },
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

