/**
 * public-submit Edge Function
 *
 * Universal intake endpoint for all public application forms.
 * Accepts anonymous POSTs, validates per-type required fields,
 * resolves tenant_id from program_id when present, and inserts
 * into the application_intake buffer. Never writes directly to
 * workflow tables.
 *
 * Security: CORS allowlist, optional submit key, honeypot,
 * payload cap, per-IP rate limiting, per-type field allowlist.
 *
 * Copyright (c) 2025–2026 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { APPLICATION_TYPES, VALID_TYPES } from './application-types.ts';

// ── Environment ────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUBLIC_SUBMIT_KEY = Deno.env.get('PUBLIC_SUBMIT_KEY') || '';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// ── Constants ──────────────────────────────────────────────────
const MAX_PAYLOAD_BYTES = 30_000;
const RATE_WINDOW_MINUTES = 15;
const RATE_MAX_SUBMISSIONS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HONEYPOT_FIELDS = ['hp', 'website_url', 'fax_number', 'company_website'];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ────────────────────────────────────────────────────

function corsHeaders(origin: string): Record<string, string> {
  const allowed =
    ALLOWED_ORIGINS.length === 0
      ? origin || '*'
      : ALLOWED_ORIGINS.includes(origin)
        ? origin
        : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-public-submit-key',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body: Record<string, unknown>, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

function clean(v: unknown, max = 2000): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return s ? s.slice(0, max) : null;
}

function sanitizePayload(
  raw: Record<string, unknown>,
  allowed: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    const val = raw[key];
    if (val === undefined || val === null) continue;

    if (typeof val === 'object' && !Array.isArray(val)) {
      const s = JSON.stringify(val);
      if (s.length <= 8000) out[key] = val;
    } else if (Array.isArray(val)) {
      const s = JSON.stringify(val);
      if (s.length <= 4000) out[key] = val;
    } else {
      out[key] = clean(val) ?? '';
    }
  }
  return out;
}

// ── Main handler ───────────────────────────────────────────────

serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, origin);
  }

  // ── 1. Submit key ──────────────────────────────────────────
  if (PUBLIC_SUBMIT_KEY) {
    if (req.headers.get('x-public-submit-key') !== PUBLIC_SUBMIT_KEY) {
      return json({ error: 'Unauthorized' }, 401, origin);
    }
  }

  // ── 2. Parse + size check ──────────────────────────────────
  const raw = await req.text();
  if (raw.length > MAX_PAYLOAD_BYTES) {
    return json({ error: 'Payload too large' }, 413, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Request body must be a JSON object' }, 400, origin);
  }

  // ── 3. Honeypot ────────────────────────────────────────────
  for (const field of HONEYPOT_FIELDS) {
    if (body[field]) {
      // Silent accept — bots think it worked
      return json({ ok: true, id: '00000000-0000-0000-0000-000000000000' }, 200, origin);
    }
  }

  // ── 4. Validate application_type ───────────────────────────
  const applicationType = clean(body.application_type, 80);
  if (!applicationType || !VALID_TYPES.includes(applicationType)) {
    return json(
      { error: 'Invalid or missing application_type', valid_types: VALID_TYPES },
      400,
      origin
    );
  }

  const config = APPLICATION_TYPES[applicationType];

  // ── 5. Required fields ─────────────────────────────────────
  const missing: string[] = [];
  for (const field of config.required) {
    const val = body[field];
    if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    return json({ error: 'Missing required fields', fields: missing }, 400, origin);
  }

  // ── 6. Email validation ────────────────────────────────────
  for (const ef of ['email', 'contact_email']) {
    const v = body[ef];
    if (typeof v === 'string' && v.trim() && !EMAIL_RE.test(v.trim())) {
      return json({ error: `Invalid email format: ${ef}` }, 400, origin);
    }
  }

  // ── 7. Sanitize payload (allowlist only) ───────────────────
  const payload = sanitizePayload(body, config.allowed);

  // ── 8. Resolve program_id → tenant_id ──────────────────────
  let programId: string | null = null;
  let resolvedTenantId: string | null = null;

  if (body.program_id && typeof body.program_id === 'string') {
    if (!UUID_RE.test(body.program_id)) {
      return json({ error: 'Invalid program_id format (expected UUID)' }, 400, origin);
    }
    programId = body.program_id;

    const { data: program } = await supabase
      .from('programs')
      .select('id, tenant_id, is_active, is_published')
      .eq('id', programId)
      .single();

    if (!program || !program.is_active) {
      return json({ error: 'Program not found or inactive' }, 400, origin);
    }

    // is_published may not exist on all rows; treat null as published
    if (program.is_published === false) {
      return json({ error: 'Program is not currently accepting applications' }, 400, origin);
    }

    resolvedTenantId = program.tenant_id ?? null;
  }

  // ── 9. Rate limit ─────────────────────────────────────────
  const clientIp = getClientIp(req);
  try {
    const { data: allowed } = await supabase.rpc('intake_rate_check', {
      p_ip: clientIp,
      p_window_minutes: RATE_WINDOW_MINUTES,
      p_max_submissions: RATE_MAX_SUBMISSIONS,
    });
    if (allowed === false) {
      return json(
        { error: 'Too many submissions. Please try again later.', retry_after_minutes: RATE_WINDOW_MINUTES },
        429,
        origin
      );
    }
  } catch (err) {
    // Fail open — don't block if rate-limit function errors
    console.error('Rate limit check error:', err);
  }

  // ── 10. Insert into application_intake ─────────────────────
  const { data: intake, error: insertError } = await supabase
    .from('application_intake')
    .insert({
      application_type: applicationType,
      program_id: programId,
      payload,
      resolved_tenant_id: resolvedTenantId,
      ip_address: clientIp,
      user_agent: (req.headers.get('user-agent') || '').slice(0, 500),
      source: 'public_form',
    })
    .select('id, created_at')
    .single();

  if (insertError) {
    console.error('Intake insert failed:', insertError.message);
    return json({ error: 'Submission failed. Please try again.' }, 500, origin);
  }

  // ── 11. Success ────────────────────────────────────────────
  return json(
    {
      ok: true,
      id: intake.id,
      application_type: applicationType,
      created_at: intake.created_at,
      message: 'Application received. You will be contacted within 2 business days.',
    },
    201,
    origin
  );
});
