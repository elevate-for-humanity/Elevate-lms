/**
 * GET /api/jobs/government-feed
 *
 * Fetches jobs from government sources and upserts into government_job_feed.
 * Sources:
 *   - USAJobs (jobs.gov) — federal jobs near Indiana
 *   - CareerOneStop (careeronestop.org) — DOL-funded state job listings
 *   - Indiana Career Connect — state workforce board feed
 *
 * Called by a cron job or manually by admin. Returns summary of imported jobs.
 * Auth: admin only (called server-side or via admin panel).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── USAJobs ───────────────────────────────────────────────────────────────────
async function fetchUSAJobs(keywords: string, location = 'Indiana'): Promise<any[]> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const email = process.env.USAJOBS_USER_AGENT_EMAIL;
  if (!apiKey || !email) {
    logger.warn('[government-feed] USAJOBS_API_KEY or USAJOBS_USER_AGENT_EMAIL not set — skipping');
    return [];
  }

  const params = new URLSearchParams({
    Keyword: keywords,
    LocationName: location,
    ResultsPerPage: '25',
    Fields: 'Min',
  });

  const res = await fetch(`https://data.usajobs.gov/api/search?${params}`, {
    headers: {
      'Authorization-Key': apiKey,
      'User-Agent': email,
      Host: 'data.usajobs.gov',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    logger.warn('[government-feed] USAJobs fetch failed', { status: res.status });
    return [];
  }

  const data = await res.json();
  const items = data?.SearchResult?.SearchResultItems ?? [];

  return items.map((item: any) => {
    const j = item.MatchedObjectDescriptor;
    return {
      source: 'usajobs',
      external_id: j.PositionID,
      title: j.PositionTitle,
      organization: j.OrganizationName,
      location: j.PositionLocationDisplay,
      salary_range: j.PositionRemuneration?.[0]
        ? `$${j.PositionRemuneration[0].MinimumRange}–$${j.PositionRemuneration[0].MaximumRange}`
        : null,
      job_type: j.PositionSchedule?.[0]?.Name ?? null,
      remote_type: 'onsite',
      description: j.QualificationSummary ?? null,
      application_url: j.ApplyURI?.[0] ?? j.PositionURI,
      posted_at: j.PublicationStartDate ?? null,
      closes_at: j.ApplicationCloseDate ?? null,
      raw_payload: j,
    };
  });
}

// ── CareerOneStop ─────────────────────────────────────────────────────────────
// API docs: https://www.careeronestop.org/Developers/WebAPI/Jobs/list-jobs.aspx
// URL pattern: /v1/jobsearch/{userId}/{keyword}/{location}/{radius}/{startRecord}/{sortColumns}/{sortOrder}/{days}/{limit}
// Auth: Authorization: Bearer <CAREERONESTOP_TOKEN>
//
// NOTE: The jobsearch API requires separate service approval from CareerOneStop.
// Account xmXrnhnrnn4DZNX has occupation API approved but not jobsearch.
// To enable: log into careeronestop.org developer portal and request jobsearch access,
// or email api@careeronestop.org referencing user ID xmXrnhnrnn4DZNX.
async function fetchCareerOneStop(keyword: string, location = 'Indianapolis, IN'): Promise<any[]> {
  const userId = process.env.CAREERONESTOP_USER_ID;
  const token = process.env.CAREERONESTOP_TOKEN ?? process.env.CAREERONESTOP_API_KEY;
  if (!token || !userId) {
    logger.warn('[government-feed] CAREERONESTOP_USER_ID or token not set — skipping');
    return [];
  }

  // Path params: keyword / location / radius=50mi / startRecord=0 / sortColumns=0 / sortOrder=0 / days=30 / limit=25
  const url = [
    'https://api.careeronestop.org/v1/jobsearch',
    userId,
    encodeURIComponent(keyword),
    encodeURIComponent(location),
    '50',   // radius miles
    '0',    // startRecord
    '0',    // sortColumns (0 = relevance)
    '0',    // sortOrder (0 = desc)
    '30',   // days posted within
    '25',   // limit
  ].join('/');

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    logger.warn('[government-feed] CareerOneStop network error', { keyword, err });
    return [];
  }

  if (res.status === 401) {
    // jobsearch requires separate service approval — account has occupation approved but not jobsearch
    logger.warn('[government-feed] CareerOneStop jobsearch not approved for this account — request access at careeronestop.org developer portal');
    return [];
  }

  if (!res.ok) {
    logger.warn('[government-feed] CareerOneStop fetch failed', { status: res.status, keyword });
    return [];
  }

  const data = await res.json();
  const jobs: any[] = data?.Jobs ?? [];

  return jobs.map((j: any) => ({
    source: 'careeronestop',
    external_id: j.JobID ?? `${j.JobTitle}-${j.DatePosted}-${j.Company}`,
    title: j.JobTitle,
    organization: j.Company,
    location: [j.City, j.State].filter(Boolean).join(', '),
    salary_range: j.Pay ?? null,
    job_type: j.JobType ?? null,
    remote_type: j.IsRemote ? 'remote' : 'onsite',
    description: j.JobDescription ?? null,
    application_url: j.JobURL,
    posted_at: j.DatePosted ?? null,
    closes_at: null,
    raw_payload: j,
  }));
}

// ── Indiana Career Connect (public RSS/JSON) ──────────────────────────────────
async function fetchIndianaCareerConnect(keyword: string): Promise<any[]> {
  // Indiana Career Connect does not have a public API key endpoint.
  // We use their public job search URL as a discoverable link — actual
  // scraping requires a partnership agreement with Indiana DWD.
  // Return empty until API credentials are configured.
  const apiKey = process.env.INDIANA_CAREER_CONNECT_API_KEY;
  if (!apiKey) {
    logger.info('[government-feed] INDIANA_CAREER_CONNECT_API_KEY not set — skipping (link-out only)');
    return [];
  }

  // Placeholder for future DWD API integration
  return [];
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  // Allow cron/internal triggers via x-cron-secret header
  const cronSecret = request.headers.get('x-cron-secret');
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET;
  if (!isCron) {
    const auth = await apiRequireAdmin(request);
    if (auth.error) return auth.error;
  }

  const db = await requireAdminClient();

  const keywords = [
    'IT support technician',
    'cybersecurity analyst',
    'HVAC technician',
    'medical assistant',
    'certified nursing assistant',
    'CDL driver',
    'electrician apprentice',
    'data analyst',
    'project manager',
  ];

  let totalImported = 0;
  let totalSkipped = 0;

  for (const keyword of keywords) {
    const [usaJobs, cosJobs] = await Promise.all([
      fetchUSAJobs(keyword),
      fetchCareerOneStop(keyword),
    ]);

    const allJobs = [...usaJobs, ...cosJobs];

    for (const job of allJobs) {
      const { error } = await db
        .from('government_job_feed')
        .upsert(job, { onConflict: 'source,external_id', ignoreDuplicates: true });

      if (error) {
        logger.warn('[government-feed] upsert failed', { job: job.external_id, error });
        totalSkipped++;
      } else {
        totalImported++;
      }
    }
  }

  logger.info('[government-feed] import complete', { totalImported, totalSkipped });

  return NextResponse.json({ ok: true, imported: totalImported, skipped: totalSkipped });
}

// GET returns current feed stats
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const db = await requireAdminClient();

  const { data, error } = await db
    .from('government_job_feed')
    .select('source, promoted_to_job_postings, imported_at')
    .order('imported_at', { ascending: false })
    .limit(1);

  const { count } = await db
    .from('government_job_feed')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    total: count ?? 0,
    lastImport: data?.[0]?.imported_at ?? null,
    sources: ['usajobs', 'careeronestop', 'indiana_career_connect'],
    configured: {
      usajobs: !!process.env.USAJOBS_API_KEY,
      careeronestop: !!process.env.CAREERONESTOP_TOKEN,
      indiana_career_connect: !!process.env.INDIANA_CAREER_CONNECT_API_KEY,
    },
  });
}
