import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSamApiKey() {
  return process.env.SAM_GOV_API_KEY || process.env.SAMS_GOV_API_KEY || process.env.SAMS_API_KEY;
}

function normalizeGrantRow(row: any) {
  return {
    opportunityId:
      row.opportunityId || row.opportunityNumber || row.noticeId || row.solicitationNumber || '',
    title: row.title || row.opportunityTitle || row.synopsis || 'Untitled grant',
    agency: row.agency || row.department || row.organization || row.agencyName || '',
    closeDate: row.closeDate || row.responseDate || row.archiveDate || null,
    postedDate: row.postedDate || row.publishDate || null,
    awardFloor: row.awardFloor || row.minimumAward || null,
    awardCeiling: row.awardCeiling || row.maximumAward || null,
    url:
      row.url ||
      row.link ||
      (row.noticeId
        ? `https://sam.gov/opp/${encodeURIComponent(String(row.noticeId))}/view`
        : null),
    category: row.category || row.noticeType || row.type || '',
    description: row.description || row.synopsis || row.summary || '',
    raw: row,
  };
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const apiKey = getSamApiKey();
  if (!apiKey) {
    return safeError('SAM_GOV_API_KEY is not configured', 500);
  }

  try {
    const params = new URL(request.url).searchParams;
    const keyword = (params.get('keyword') || '').trim();
    const agency = (params.get('agency') || '').trim();
    const noticeType = (params.get('noticeType') || '').trim();
    const limit = Math.max(1, Math.min(Number(params.get('limit') || '20'), 100));

    const query = new URLSearchParams();
    query.set('api_key', apiKey);
    query.set('limit', String(limit));
    query.set('offset', '0');

    if (keyword) query.set('keyword', keyword);
    if (agency) query.set('agency', agency);
    if (noticeType) query.set('noticeType', noticeType);

    // Most SAM feeds support postedFrom; keep it broad by default.
    if (!params.get('postedFrom')) query.set('postedFrom', '01/01/2024');

    // /prod/ path is deprecated and returns 401 for most API keys.
    // Try the canonical v2 endpoint first, fall back to /prod/ for legacy keys.
    const endpoints = [
      `https://api.sam.gov/opportunities/v2/search?${query.toString()}`,
      `https://api.sam.gov/prod/opportunities/v2/search?${query.toString()}`,
    ];

    let lastError: string | null = null;
    for (const endpoint of endpoints) {
      const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (!res.ok) {
        lastError = `SAM API ${res.status}`;
        continue;
      }

      const payload = await res.json().catch(() => null);
      if (!payload) {
        lastError = 'Invalid JSON from SAM API';
        continue;
      }

      const rows = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.opportunities)
          ? payload.opportunities
          : Array.isArray(payload)
            ? payload
            : [];

      return NextResponse.json({
        source: endpoint.includes('/prod/') ? 'sam.gov/prod (legacy)' : 'sam.gov/v2',
        count: rows.length,
        grants: rows.map(normalizeGrantRow),
      });
    }

    return safeError(lastError || 'Failed to query SAM API', 502);
  } catch (error) {
    return safeInternalError(error, 'Failed to search SAM grants');
  }
}