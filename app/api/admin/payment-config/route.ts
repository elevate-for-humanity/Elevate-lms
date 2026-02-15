/**
 * Admin-only diagnostic endpoint — checks BNPL provider configuration status.
 * Returns which env vars are present (not their values).
 * Requires admin authentication.
 */

import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/authGuards';
import { sezzle } from '@/lib/sezzle/client';
import { affirm } from '@/lib/affirm/client';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const guard = await apiRequireAdmin();
  if (guard) return guard;

  const response = NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    sezzle: {
      configured: sezzle.isConfigured(),
      envVars: {
        SEZZLE_PUBLIC_KEY: !!process.env.SEZZLE_PUBLIC_KEY,
        SEZZLE_PRIVATE_KEY: !!process.env.SEZZLE_PRIVATE_KEY,
        SEZZLE_ENVIRONMENT: process.env.SEZZLE_ENVIRONMENT || '(not set, defaults to sandbox)',
        SEZZLE_WEBHOOK_SECRET: !!process.env.SEZZLE_WEBHOOK_SECRET,
      },
    },
    affirm: {
      configured: affirm.isConfigured(),
      envVars: {
        AFFIRM_PUBLIC_KEY: !!process.env.AFFIRM_PUBLIC_KEY,
        NEXT_PUBLIC_AFFIRM_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY,
        AFFIRM_PRIVATE_KEY: !!process.env.AFFIRM_PRIVATE_KEY,
        AFFIRM_ENVIRONMENT: process.env.AFFIRM_ENVIRONMENT || '(not set, defaults to production)',
      },
    },
    stripe: {
      envVars: {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
    },
    supabase: {
      envVars: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Vary', 'Authorization, Cookie');
  return response;
}
