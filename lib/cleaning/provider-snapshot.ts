import 'server-only';
import { createHash } from 'node:crypto';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function providerIdentityRevision(websiteId: string, leadId: string, email: string, name: string) {
  return digest([websiteId, leadId, email.toLowerCase(), name]);
}

export function providerApplicationName(lead: { name?: unknown; message?: unknown }) {
  const company = String(lead.message || '').match(/Company name, if applicable:[ \t]*([^\r\n]*)/)?.[1]?.trim();
  return (company || String(lead.name || '').trim()).slice(0, 200);
}

export const providerReviewColumns = [
  'id', 'lead_id', 'name', 'email', 'hourly_cents', 'zips', 'services', 'opted_in',
  'eligibility', 'review_note', 'reviewed_by', 'reviewed_at',
] as const;
// Keep this literal so Supabase can infer the selected row rather than treating
// a runtime string as an unparseable query.
export const providerReviewSelect = 'id,lead_id,name,email,hourly_cents,zips,services,opted_in,eligibility,review_note,reviewed_by,reviewed_at';

export function providerReviewRevision(row: Record<string, unknown>) {
  return digest(providerReviewColumns.map(column => row[column] ?? null));
}

/** PostgREST array equality needs a PostgreSQL array literal, not JS coercion. */
export function postgresTextArray(values: string[]) {
  return '{' + values.map(value => '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
}

/** Compare the entire displayed review snapshot in the UPDATE itself. */
export function matchProviderReviewSnapshot(query: any, row: Record<string, unknown>) {
  for (const column of providerReviewColumns) {
    const value = row[column] ?? null;
    if (value === null) query = query.is(column, null);
    else if (column === 'zips' || column === 'services') {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        throw new Error('Invalid provider review coverage.');
      }
      query = query.eq(column, postgresTextArray(value));
    } else query = query.eq(column, value);
  }
  return query;
}
