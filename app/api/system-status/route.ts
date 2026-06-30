import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'elevate-lms',
    runtime: 'nodejs',
    environment: process.env.NODE_ENV ?? 'unknown',
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    aiConfigured: Boolean(process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    checkedAt: new Date().toISOString(),
  });
}
