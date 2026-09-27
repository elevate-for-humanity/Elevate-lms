import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { searchOnetOccupations } from '@/lib/onet/client';
import { fetchUsaJobs, type JobRow } from '@/lib/industry/usajobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function text(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }

async function fetchCareerOneStop(keyword: string, location: string, limit: number): Promise<JobRow[]> {
  const userId = process.env.CAREERONESTOP_USER_ID?.trim();
  const token = (
    process.env.CAREERONESTOP_API_KEY ||
    process.env.CAREERONESTOP_TOKEN
  )?.trim();
  if (!userId || !token) return [];

  const path = [
    'https://api.careeronestop.org/v2/jobsearch',
    encodeURIComponent(userId),
    encodeURIComponent(keyword || '0'),
    encodeURIComponent(location || 'US'),
    '50',
    '0',
    '0',
    '0',
    String(Math.min(limit, 100)),
    '30',
  ].join('/');

  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`CareerOneStop returned HTTP ${response.status}`);

  const payload = (await response.json()) as {
    Jobs?: Array<Record<string, unknown>>;
  };

  return (payload.Jobs ?? []).flatMap((job) => {
    const externalId = text(job.JvId);
    const title = text(job.JobTitle);
    if (!externalId || !title) return [];
    return [{
      source: 'CareerOneStop',
      external_id: externalId,
      title,
      organization: text(job.Company) || null,
      location: text(job.Location) || null,
      salary_range: null,
      job_type: null,
      remote_type: null,
      description: text(job.DescriptionSnippet) || null,
      application_url: text(job.URL) || null,
      posted_at: text(job.AcquisitionDate) || null,
      closes_at: null,
      raw_payload: job,
      imported_at: new Date().toISOString(),
      promoted_to_job_postings: false,
    }];
  });
}

async function sourceCounts() {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('government_job_feed')
    .select('source,imported_at')
    .order('imported_at', { ascending: false })
    .limit(1000);
  if (error) throw error;

  const counts = new Map<string, { records: number; latestImport: string | null }>();
  for (const row of data ?? []) {
    const source = String(row.source ?? 'unknown');
    const current = counts.get(source) ?? { records: 0, latestImport: null };
    current.records += 1;
    if (!current.latestImport && row.imported_at) current.latestImport = row.imported_at;
    counts.set(source, current);
  }
  return Object.fromEntries(counts);
}

export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const limitRaw = Number(new URL(request.url).searchParams.get('limit') ?? '50');
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.trunc(limitRaw))) : 50;
  const { data, error } = await db
    .from('government_job_feed')
    .select('id,source,external_id,title,organization,location,salary_range,job_type,remote_type,description,application_url,posted_at,closes_at,imported_at')
    .order('imported_at', { ascending: false })
    .limit(limit);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: {
      usajobs: Boolean(process.env.USAJOBS_API_KEY && process.env.USAJOBS_USER_AGENT_EMAIL),
      careerOneStop: Boolean(
        process.env.CAREERONESTOP_USER_ID &&
        (process.env.CAREERONESTOP_API_KEY || process.env.CAREERONESTOP_TOKEN),
      ),
      onet: Boolean(process.env.ONET_API_KEY),
    },
    sources: await sourceCounts(),
    jobs: data ?? [],
    count: data?.length ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const keyword = text(body?.keyword) || 'barber';
  const location = text(body?.location) || 'Indiana';
  const requestedLimit = Number(body?.limit ?? 25);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(100, Math.trunc(requestedLimit)))
    : 25;

  const settled = await Promise.allSettled([
    fetchUsaJobs(keyword, location, limit),
    fetchCareerOneStop(keyword, location, limit),
    searchOnetOccupations(keyword, 10),
  ]);
  const usaJobs = settled[0].status === 'fulfilled' ? settled[0].value : [];
  const careerOneStop = settled[1].status === 'fulfilled' ? settled[1].value : [];
  const onet = settled[2].status === 'fulfilled' ? settled[2].value : [];

  const rows = [...usaJobs, ...careerOneStop];
  const db = await requireAdminClient();
  if (rows.length) {
    const { error } = await db
      .from('government_job_feed')
      .upsert(rows, { onConflict: 'source,external_id' });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    keyword,
    location,
    imported: {
      usaJobs: usaJobs.length,
      careerOneStop: careerOneStop.length,
      total: rows.length,
    },
    onet: {
      configured: Boolean(process.env.ONET_API_KEY),
      occupations: onet,
      attribution: 'O*NET® is a trademark of USDOL/ETA.',
    },
    errors: {
      usaJobs: settled[0].status === 'rejected' ? String(settled[0].reason) : null,
      careerOneStop: settled[1].status === 'rejected' ? String(settled[1].reason) : null,
      onet: settled[2].status === 'rejected' ? String(settled[2].reason) : null,
    },
    sources: await sourceCounts(),
  });
}
