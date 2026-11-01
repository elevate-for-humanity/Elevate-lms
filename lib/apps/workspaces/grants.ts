import type { GrantsGovOpportunity } from '@/lib/integrations/grants-gov';
export function grantDate(value: unknown): string | null {
  if (!value) return null;
  const text = String(value).trim();
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  // Provider deadlines are calendar dates, not midnight in the host timezone.
  if (us || iso) {
    const year = Number(us ? us[3] : iso![1]);
    const month = Number(us ? us[1] : iso![2]);
    const day = Number(us ? us[2] : iso![3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    return date.toISOString().slice(0, 10);
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : null;
}
export function grantRecord(opportunity: GrantsGovOpportunity) {
  return {
    external_id: `grants-gov:${opportunity.id}`,
    title: opportunity.title,
    opportunity_number: opportunity.number,
    agency: opportunity.agency.name,
    agency_name: opportunity.agency.name,
    agency_code: opportunity.agency.code,
    summary: opportunity.synopsis?.synopsisDesc || null,
    source: 'grants.gov',
    status:
      opportunity.status === 'forecasted'
        ? 'upcoming'
        : opportunity.status === 'posted'
          ? 'open'
          : 'closed',
    due_date: grantDate(opportunity.dates.closeDate),
    deadline: grantDate(opportunity.dates.closeDate),
    posted_date: grantDate(opportunity.dates.postDate),
    url: opportunity.opportunityUrl,
    opportunity_url: opportunity.opportunityUrl,
    award_ceiling: opportunity.award?.ceiling?.toString() ?? null,
    award_floor: opportunity.award?.floor ?? null,
    updated_at: new Date().toISOString(),
  };
}
export function visibleGrantRecords(rows: any[], today = new Date().toISOString().slice(0, 10)) {
  return rows
    .filter((row) => {
      const deadline = grantDate(row.deadline || row.due_date || row.close_date);
      return !deadline || deadline >= today;
    })
    .sort((a, b) =>
      String(a.deadline || a.due_date || a.close_date || '9999').localeCompare(
        String(b.deadline || b.due_date || b.close_date || '9999'),
      ),
    )
    .slice(0, 50);
}
