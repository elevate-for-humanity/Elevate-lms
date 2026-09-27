/** Shared USAJOBS federal job feed for Admin and Ultimate workforce enrichment. */
export type JobRow = {
  source: string;
  external_id: string;
  title: string;
  organization: string | null;
  location: string | null;
  salary_range: string | null;
  job_type: string | null;
  remote_type: string | null;
  description: string | null;
  application_url: string | null;
  posted_at: string | null;
  closes_at: string | null;
  raw_payload: Record<string, unknown>;
  imported_at: string;
  promoted_to_job_postings: boolean;
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function salaryRange(minimum: unknown, maximum: unknown): string | null {
  const min = Number(minimum);
  const max = Number(maximum);
  if (!Number.isFinite(min) && !Number.isFinite(max)) return null;
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return `$${Math.round(min).toLocaleString()} - $${Math.round(max).toLocaleString()}`;
  }
  if (Number.isFinite(min)) return `From $${Math.round(min).toLocaleString()}`;
  return `Up to $${Math.round(max).toLocaleString()}`;
}

export async function fetchUsaJobs(keyword: string, location: string, limit: number): Promise<JobRow[]> {
  const apiKey = process.env.USAJOBS_API_KEY?.trim();
  const userAgent = process.env.USAJOBS_USER_AGENT_EMAIL?.trim();
  if (!apiKey || !userAgent) return [];

  const url = new URL('https://data.usajobs.gov/api/search');
  url.searchParams.set('Keyword', keyword);
  if (location) url.searchParams.set('LocationName', location);
  url.searchParams.set('ResultsPerPage', String(Math.min(limit, 100)));
  url.searchParams.set('DatePosted', '30');

  const response = await fetch(url, {
    headers: {
      Host: 'data.usajobs.gov',
      'User-Agent': userAgent,
      'Authorization-Key': apiKey,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`USAJobs returned HTTP ${response.status}`);

  const payload = (await response.json()) as {
    SearchResult?: {
      SearchResultItems?: Array<{
        MatchedObjectId?: string;
        MatchedObjectDescriptor?: Record<string, any>;
      }>;
    };
  };

  return (payload.SearchResult?.SearchResultItems ?? []).flatMap((item) => {
    const d = item.MatchedObjectDescriptor ?? {};
    const externalId = text(d.PositionID ?? item.MatchedObjectId);
    const title = text(d.PositionTitle);
    if (!externalId || !title) return [];

    const remuneration = Array.isArray(d.PositionRemuneration) ? d.PositionRemuneration[0] ?? {} : {};
    const schedule = Array.isArray(d.PositionSchedule) ? d.PositionSchedule[0] ?? {} : {};
    const locations = Array.isArray(d.PositionLocation)
      ? d.PositionLocation.map((entry: any) => text(entry?.LocationName)).filter(Boolean)
      : [];
    const details = d.UserArea?.Details ?? {};

    return [{
      source: 'USAJobs.gov',
      external_id: externalId,
      title,
      organization: text(d.OrganizationName) || null,
      location: locations.join('; ') || null,
      salary_range: salaryRange(remuneration.MinimumRange, remuneration.MaximumRange),
      job_type: text(schedule.Name) || null,
      remote_type: d.RemoteIndicator === true ? 'remote' : null,
      description: text(details.JobSummary ?? details.MajorDuties?.[0]) || null,
      application_url: text(d.PositionURI) || null,
      posted_at: text(d.PublicationStartDate) || null,
      closes_at: text(d.ApplicationCloseDate) || null,
      raw_payload: item as unknown as Record<string, unknown>,
      imported_at: new Date().toISOString(),
      promoted_to_job_postings: false,
    }];
  });
}

