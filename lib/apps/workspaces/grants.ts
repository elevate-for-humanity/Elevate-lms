import type { GrantsGovOpportunity } from '@/lib/integrations/grants-gov';
export function grantDate(value: unknown): string | null {
  if (!value) return null;
  const parsed = Date.parse(String(value));
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
