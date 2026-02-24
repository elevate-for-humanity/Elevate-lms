import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Public endpoint uses anon key — the view grants SELECT to anon.
// Do NOT use service role key here.
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// In-memory rate limiting (use Upstash Redis in production).
// Two buckets: per-IP and per-tracking-code.
const ipLimits = new Map<string, { count: number; resetTime: number }>();
const codeLimits = new Map<string, { count: number; resetTime: number }>();
const IP_RATE_LIMIT = 5;
const CODE_RATE_LIMIT = 5;
const RATE_WINDOW = 60_000; // 1 minute
const FAILURE_DELAY_MS = 300; // slow down enumeration attempts

function checkLimit(
  map: Map<string, { count: number; resetTime: number }>,
  key: string,
  limit: number,
): boolean {
  const now = Date.now();
  const record = map.get(key);

  if (!record || now > record.resetTime) {
    map.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }

  if (record.count >= limit) return true;
  record.count++;
  return false;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Generic response for not-found / bad-format — prevents tracking-code enumeration
const NOT_FOUND_BODY = {
  success: false,
  error: 'No return found for the provided tracking code.',
};

// Every response must include these headers — no CDN caching of tracking results
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: NO_CACHE_HEADERS });
}

/**
 * POST: Look up return status by public tracking code.
 * Reads ONLY from sfc_tax_return_public_status view — never from sfc_tax_returns.
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Netlify sets x-nf-client-connection-ip; fall back to x-forwarded-for first entry
    const rawForwarded = request.headers.get('x-nf-client-connection-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown';
    const ip = rawForwarded;

    if (checkLimit(ipLimits, ip, IP_RATE_LIMIT)) {
      return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429);
    }

    const body = await request.json();
    const trackingCode = (body.trackingCode || '').trim();

    // Same generic message for bad format and not-found — prevents enumeration
    if (!trackingCode || trackingCode.length < 6 || trackingCode.length > 40) {
      await delay(FAILURE_DELAY_MS);
      return jsonResponse(NOT_FOUND_BODY, 404);
    }

    // Per-code throttle: prevents spraying many codes from rotating IPs
    if (checkLimit(codeLimits, trackingCode, CODE_RATE_LIMIT)) {
      return jsonResponse({ error: 'Too many requests. Please try again later.' }, 429);
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      await delay(FAILURE_DELAY_MS);
      return jsonResponse(NOT_FOUND_BODY, 404);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Read from the VIEW only — never from sfc_tax_returns directly.
    // View exposes: tracking_id, status (mapped), rejection_reason (sanitized),
    // created_at, updated_at, client_first_name, client_last_initial.
    // Does NOT expose: efile_submission_id, raw last_error, user_id, email, phone, notes.
    const { data, error } = await supabase
      .from('sfc_tax_return_public_status')
      .select('tracking_id, status, rejection_reason, created_at, updated_at, client_first_name, client_last_initial')
      .eq('tracking_id', trackingCode)
      .maybeSingle();

    if (error || !data) {
      await delay(FAILURE_DELAY_MS);
      return jsonResponse(NOT_FOUND_BODY, 404);
    }

    // Status messages map to the view's public-safe status values
    const statusMessages: Record<string, string> = {
      received: 'Your tax return has been received and is being processed.',
      processing: 'Your return is being reviewed and prepared for filing.',
      submitted: 'Your return has been submitted to the IRS.',
      accepted: 'Your return has been accepted by the IRS.',
      action_required: 'Your return requires attention. A preparer will contact you.',
    };

    // Rejection reason messages — sanitized codes from the view, not raw errors
    const rejectionMessages: Record<string, string> = {
      missing_documents: 'Additional documents are needed to complete your return.',
      verification_failed: 'Identity verification could not be completed.',
      identity_mismatch: 'Information provided does not match IRS records.',
      duplicate_filing: 'A return has already been filed for this tax year.',
      review_required: 'Your return requires additional review by a preparer.',
    };

    // All masking is done in SQL — the route only formats the response
    return jsonResponse({
      success: true,
      trackingCode: data.tracking_id,
      status: data.status,
      statusMessage: statusMessages[data.status] || 'Status is being updated.',
      clientName: data.client_first_name
        ? `${data.client_first_name} ${data.client_last_initial || ''}.`
        : undefined,
      rejectionReason: data.rejection_reason
        ? rejectionMessages[data.rejection_reason] || 'Your return requires attention.'
        : undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, 200);
  } catch {
    return jsonResponse(NOT_FOUND_BODY, 404);
  }
}

// GET handler removed — tracking codes must be submitted via POST body, never in URL params
