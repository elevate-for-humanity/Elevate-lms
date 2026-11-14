/**
 * Disposable production QA identities use the reserved .invalid domain.
 * They must exercise real authorization and persistence paths without sending
 * customer-facing or staff-facing operational notifications.
 */
export function isQaE2EIdentity(email: string | null | undefined): boolean {
  return String(email || '').trim().toLowerCase().endsWith('@qa.invalid');
}
