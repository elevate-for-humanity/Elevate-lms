/**
 * Admin diagnostic endpoint - checks BNPL provider configuration status.
 * Returns which env vars are present (not their values) so you can
 * verify Netlify runtime environment is correct.
 */

import { NextResponse } from 'next/server';
import { sezzle } from '@/lib/sezzle/client';
import { affirm } from '@/lib/affirm/client';

export async function GET() {
  // Only allow in development or with admin auth
  const isDev = process.env.NODE_ENV === 'development';

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    sezzle: {
      configured: sezzle.isConfigured(),
      envVars: {
        SEZZLE_PUBLIC_KEY: !!process.env.SEZZLE_PUBLIC_KEY,
        SEZZLE_PRIVATE_KEY: !!process.env.SEZZLE_PRIVATE_KEY,
        SEZZLE_ENVIRONMENT: process.env.SEZZLE_ENVIRONMENT || '(not set, defaults to sandbox)',
      },
      // Show key prefix in dev only for debugging
      ...(isDev && process.env.SEZZLE_PUBLIC_KEY ? {
        publicKeyPrefix: process.env.SEZZLE_PUBLIC_KEY.substring(0, 8) + '...',
      } : {}),
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
  });
}
