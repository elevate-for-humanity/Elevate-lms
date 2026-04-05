export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/admin/submissions/ingest-link
 *
 * Accepts a URL, fetches the page, extracts opportunity metadata,
 * saves a sos_source_links row, and creates a draft sos_opportunities row.
 *
 * Body: { url: string; organization_id: string }
 * Returns: { source_link_id, opportunity_id, extracted }
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

// ── Lightweight metadata extractor ───────────────────────────────────────────
// Parses raw HTML with regex — no DOM dependency needed in edge-compatible code.

function extractText(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim() : null;
}

function extractDate(html: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    const re = new RegExp(`${kw}[^\\d]{0,40}(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4}|\\w+ \\d{1,2},? \\d{4})`, 'i');
    const m = html.match(re);
    if (m) {
      try {
        const d = new Date(m[1]);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch { /* skip */ }
    }
  }
  return null;
}

function extractDollarAmount(html: string): number | null {
  const m = html.match(/\$\s*([\d,]+(?:\.\d+)?)\s*(million|M|thousand|K)?/i);
  if (!m) return null;
  let val = parseFloat(m[1].replace(/,/g, ''));
  const unit = (m[2] || '').toLowerCase();
  if (unit === 'million' || unit === 'm') val *= 1_000_000;
  if (unit === 'thousand' || unit === 'k') val *= 1_000;
  return Math.round(val);
}

function detectOpportunityType(url: string, html: string): string {
  const combined = (url + ' ' + html).toLowerCase();
  if (combined.includes('rfp') || combined.includes('request for proposal')) return 'rfp';
  if (combined.includes('rfq') || combined.includes('request for quote')) return 'rfq';
  if (combined.includes('rfi') || combined.includes('request for information')) return 'rfi';
  if (combined.includes('grant') || combined.includes('nofa') || combined.includes('notice of funding')) return 'grant';
  if (combined.includes('bid') || combined.includes('invitation to bid') || combined.includes('itb')) return 'bid';
  if (combined.includes('vendor') || combined.includes('registration')) return 'vendor_registration';
  if (combined.includes('contract')) return 'contract';
  return 'other';
}

function extractTitle(html: string, url: string): string {
  // Try OG title, then <title>, then h1
  const og = extractText(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
    || extractText(html, /<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i);
  if (og) return og;
  const title = extractText(html, /<title[^>]*>([^<]+)<\/title>/i);
  if (title) return title;
  const h1 = extractText(html, /<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1;
  // Fall back to URL path
  return new URL(url).pathname.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'Untitled Opportunity';
}

function extractIssuer(html: string, url: string): string | null {
  const og = extractText(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i)
    || extractText(html, /<meta[^>]+content="([^"]+)"[^>]+property="og:site_name"/i);
  if (og) return og;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function extractRefNumber(html: string): string | null {
  const patterns = [
    /(?:RFP|RFQ|RFI|ITB|Solicitation|Reference|Opportunity)\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9\-_/]{4,30})/i,
    /(?:CFDA|ALN)\s*(?:No\.?|Number|#)?\s*:?\s*(\d{2}\.\d{3})/i,
    /(?:Funding Opportunity Number|FON)\s*:?\s*([A-Z0-9\-]{4,30})/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1].trim();
  }
  return null;
}

function extractScopeSummary(html: string): string | null {
  // Try meta description
  const desc = extractText(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
    || extractText(html, /<meta[^>]+content="([^"]+)"[^>]+name="description"/i);
  if (desc && desc.length > 30) return desc.slice(0, 800);
  // Try first substantial paragraph
  const pMatch = html.match(/<p[^>]*>([^<]{80,})<\/p>/i);
  if (pMatch) return pMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 800);
  return null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const authResult = await apiRequireAdmin();
  // apiRequireAdmin returns a NextResponse on failure, or the auth object on success
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;

  let body: { url?: string; organization_id?: string };
  try {
    body = await req.json();
  } catch {
    return safeError('Invalid JSON body', 400);
  }

  const { url, organization_id } = body;
  if (!url || typeof url !== 'string') return safeError('url is required', 400);
  if (!organization_id) return safeError('organization_id is required', 400);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return safeError('Invalid URL', 400);
  }

  const db = createAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // 1. Save source_link row immediately (fetch_status = pending)
  const { data: sourceLink, error: slErr } = await db
    .from('sos_source_links')
    .insert({
      organization_id,
      submitted_by: auth.id,
      original_url: url,
      source_domain: parsedUrl.hostname,
      fetch_status: 'pending',
    })
    .select()
    .single();

  if (slErr || !sourceLink) {
    logger.error('Failed to create source_link', slErr);
    return safeInternalError(slErr, 'Failed to save source link');
  }

  // 2. Fetch the page
  let html = '';
  let fetchStatus: 'success' | 'error' | 'timeout' = 'error';
  let finalUrl = url;
  let fetchError: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElevateSubmissionsBot/1.0)' },
    });
    clearTimeout(timeout);
    finalUrl = res.url || url;
    if (res.ok) {
      html = await res.text();
      fetchStatus = 'success';
    } else {
      fetchError = `HTTP ${res.status}`;
    }
  } catch (err: unknown) {
    const e = err as Error;
    fetchStatus = e.name === 'AbortError' ? 'timeout' : 'error';
    fetchError = e.message;
    logger.error('Link fetch failed', e);
  }

  // 3. Update source_link with fetch result
  await db
    .from('sos_source_links')
    .update({
      final_url: finalUrl,
      fetch_status: fetchStatus,
      fetched_at: new Date().toISOString(),
      error_message: fetchError,
    })
    .eq('id', sourceLink.id);

  // 4. Extract metadata from HTML (best-effort even on partial fetch)
  const extracted = {
    title: html ? extractTitle(html, finalUrl) : new URL(finalUrl).pathname.split('/').pop() || 'Untitled',
    issuer_name: html ? extractIssuer(html, finalUrl) : parsedUrl.hostname,
    reference_number: html ? extractRefNumber(html) : null,
    opportunity_type: detectOpportunityType(finalUrl, html),
    due_date: html ? extractDate(html, ['due', 'deadline', 'close', 'submission', 'submit by', 'proposals due']) : null,
    issue_date: html ? extractDate(html, ['issued', 'release date', 'posted', 'publish']) : null,
    questions_deadline: html ? extractDate(html, ['questions due', 'questions deadline', 'inquiries due']) : null,
    estimated_value: html ? extractDollarAmount(html) : null,
    scope_summary: html ? extractScopeSummary(html) : null,
  };

  // 5. Create draft opportunity
  const { data: opportunity, error: oppErr } = await db
    .from('sos_opportunities')
    .insert({
      organization_id,
      source_link_id: sourceLink.id,
      opportunity_type: extracted.opportunity_type,
      issuer_name: extracted.issuer_name,
      title: extracted.title,
      reference_number: extracted.reference_number,
      status: 'profiling',
      portal_url: finalUrl,
      issue_date: extracted.issue_date,
      due_date: extracted.due_date,
      questions_deadline: extracted.questions_deadline,
      estimated_value: extracted.estimated_value,
      scope_summary: extracted.scope_summary,
      profiled_by: auth.id,
      profiled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (oppErr || !opportunity) {
    logger.error('Failed to create opportunity', oppErr);
    return safeInternalError(oppErr, 'Failed to create opportunity record');
  }

  return NextResponse.json({
    source_link_id: sourceLink.id,
    opportunity_id: opportunity.id,
    fetch_status: fetchStatus,
    extracted,
  });
}
