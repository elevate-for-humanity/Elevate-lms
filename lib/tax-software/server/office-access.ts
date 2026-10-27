import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
export class OfficeAccessError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}
export async function officeAccess() {
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new OfficeAccessError(401, 'SIGN_IN_REQUIRED');
  const { data: assurance, error: assuranceError } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== 'aal2')
    throw new OfficeAccessError(403, 'MFA_REQUIRED');
  const db = await requireAdminClient();
  const [owned, staff] = await Promise.all([
    db.from('tax_offices').select('id,office_code,office_name,status').eq('owner_id', user.id),
    db.from('tax_preparers').select('office_id').eq('user_id', user.id).eq('status', 'active'),
  ]);
  if (owned.error || staff.error) throw Error('OFFICE_LOOKUP_FAILED');
  const ownedIds = (owned.data ?? []).map((o: { id: string }) => o.id);
  const officeIds = [
    ...new Set([
      ...ownedIds,
      ...(staff.data ?? [])
        .map((s: { office_id: string | null }) => s.office_id)
        .filter((id: string | null): id is string => Boolean(id)),
    ]),
  ];
  if (!officeIds.length) throw new OfficeAccessError(403, 'OFFICE_ACCESS_REQUIRED');
  const offices = await db
    .from('tax_offices')
    .select('id,office_code,office_name,status')
    .in('id', officeIds);
  if (offices.error) throw Error('OFFICE_LOOKUP_FAILED');
  return { db, user, ownedIds, officeIds, offices: offices.data ?? [] };
}
