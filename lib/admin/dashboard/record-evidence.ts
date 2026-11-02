export function isTestRecord(...values: unknown[]): boolean {
  const value = values.filter(Boolean).join(' ');
  return /\b(sample|test|demo|example|placeholder|qa[-_\s]?e2e)\b|@qa\.invalid\b|^[A-Za-z0-9_-]{30,}$/i.test(
    value,
  );
}

export function isUnpublishedOperationalProgram(row: {status?: string | null; archived_at?: string | null; title?: string | null; slug?: string | null; published?: boolean | null}): boolean {
  return row.status !== 'archived' && !row.archived_at && !isTestRecord(row.title, row.slug) && row.published !== true;
}
