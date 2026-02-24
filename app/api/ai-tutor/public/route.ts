import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createAdminClient } from '@/lib/supabase/admin';
import { PROGRAMS, buildSystemPrompt } from '@/lib/ai/programRegistry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_INPUT_CHARS = 500;
const MAX_OUTPUT_TOKENS = 400;

const ALLOWED_ORIGINS = [
  'https://www.elevateforhumanity.org',
  'https://elevateforhumanity.org',
];

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.elevateforhumanity.org')) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (origin.includes('.netlify.app')) return true;
  if (origin.includes('.gitpod.dev')) return true;
  return false;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

function hashIp(ip: string): string {
  const salt = process.env.LOG_SALT || 'elevate-public-tutor';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 16);
}

function containsPII(text: string): boolean {
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /\b(\+?1[\s.-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/;
  const ssn = /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/;
  return email.test(text) || phone.test(text) || ssn.test(text);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const headers = isAllowedOrigin(origin) ? corsHeaders(origin) : {};

  if (process.env.NODE_ENV === 'production' && origin && !isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers });
  }

  // Upstash Redis rate limit: 10 req/min per IP
  const rateLimited = await applyRateLimit(req, 'public');
  if (rateLimited) return rateLimited;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers });
  }

  const programSlug = String(body?.programSlug ?? '').trim();
  const message = String(body?.message ?? '').trim();

  // Validate program slug against registry
  if (!programSlug || !PROGRAMS[programSlug]) {
    return NextResponse.json({ error: 'Invalid program' }, { status: 400, headers });
  }

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400, headers });
  }

  if (message.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { error: `Max ${MAX_INPUT_CHARS} characters` },
      { status: 400, headers }
    );
  }

  if (containsPII(message)) {
    return NextResponse.json(
      { error: 'Please do not include personal information (email, phone, SSN).' },
      { status: 400, headers }
    );
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const program = PROGRAMS[programSlug];

  // Log request (no PII)
  async function logRequest(responseLength: number, blocked: string | null) {
    try {
      const supabase = createAdminClient();
      if (!supabase) return;
      await supabase.from('public_ai_tutor_logs').insert({
        ip_hash: ipHash,
        question_length: message.length,
        response_length: responseLength,
        blocked_reason: blocked,
      });
    } catch {
      // Non-fatal
    }
  }

  // Use the unified AI service (auto-selects Gemini or OpenAI)
  let aiAvailable = false;
  try {
    const { isAIAvailable } = await import('@/lib/ai/ai-service');
    aiAvailable = isAIAvailable();
  } catch {}

  if (!aiAvailable) {
    const fallback = `The ${program.name} program is available at Elevate for Humanity. Apply at elevateforhumanity.org${program.applyUrl} or contact us for details.`;
    await logRequest(fallback.length, 'no_ai_provider');
    return NextResponse.json({ message: fallback, fallback: true }, { headers });
  }

  const systemPrompt = buildSystemPrompt(programSlug);

  try {
    const { aiChat } = await import('@/lib/ai/ai-service');
    const result = await aiChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
      maxTokens: MAX_OUTPUT_TOKENS,
    });

    const answer = result.content
      || `I can help with ${program.name} questions. Please try rephrasing.`;

    await logRequest(answer.length, null);
    return NextResponse.json({ message: answer }, { headers });
  } catch (error) {
    logger.error('Public AI tutor error', error instanceof Error ? error : new Error(String(error)));
    await logRequest(0, 'exception');
    return NextResponse.json(
      { message: 'I\'m having trouble right now. Please try again in a moment.' },
      { headers }
    );
  }
}
