/** A generated ID or a resolved Supabase promise is not a persistence receipt. */
export function requireSavedRow<T extends { id: string }>(result: { data: T | null; error: unknown }, operation: string): T {
  if (result.error || !result.data?.id) throw new Error(`PARIS_DATABASE_WRITE_UNVERIFIED:${operation}`);
  return result.data;
}

export function requireQuerySuccess(result: { error: unknown }, operation: string): void {
  if (result.error) throw new Error(`PARIS_DATABASE_OPERATION_FAILED:${operation}`);
}
