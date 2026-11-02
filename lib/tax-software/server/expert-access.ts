import 'server-only';
import { officeAccess, OfficeAccessError } from './office-access';
/** Preparation access is stricter than office onboarding/training access. */
export async function expertAccess() {
  const context = await officeAccess();
  if (!context.user.email_confirmed_at) throw new OfficeAccessError(403, 'VERIFIED_EMAIL_REQUIRED');
  const offices = context.offices.filter((o: { status: string }) => o.status === 'active');
  const officeIds = offices.map((o: { id: string }) => o.id);
  if (!officeIds.length) throw new OfficeAccessError(403, 'ACTIVE_OFFICE_REQUIRED');
  return {
    ...context,
    offices,
    officeIds,
    ownedIds: context.ownedIds.filter((id: string) => officeIds.includes(id)),
  };
}
