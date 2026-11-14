// pre-auth-registry: exempt - officeAccess verifies authentication and MFA, and this handler additionally requires office ownership.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { officeAccess, OfficeAccessError } from '@/lib/tax-software/server/office-access';
import { taxJson } from '@/lib/tax-software/server/response';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { TAX_CAREER_JOB } from '@/lib/tax-software/recruiting/policy';
export const runtime = 'nodejs';
const inputSchema = z
  .object({
    applicationId: z.string().uuid(),
    officeId: z.string().uuid(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    ptin: z
      .string()
      .trim()
      .regex(/^P\d{8}$/),
    identityAndPtinVerified: z.literal(true),
  })
  .strict();
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  try {
    const { db, user, ownedIds, offices } = await officeAccess();
    const parsed = inputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return taxJson({ error: 'INVALID_AGENT_LINK' }, { status: 400 });
    const input = parsed.data;
    // Only the recruitment-office owner may access this applicant pool; ordinary
    // preparers and unrelated office owners must not resolve applicant identities.
    const recruitmentOwner = offices.some(
      (o: { id: string; office_code: string }) =>
        o.office_code === 'SFC-IND-001' && ownedIds.includes(o.id),
    );
    if (!recruitmentOwner || !ownedIds.includes(input.officeId))
      throw new OfficeAccessError(403, 'OFFICE_OWNER_REQUIRED');
    const application = await db
      .from('job_applications')
      .select('id,user_id')
      .eq('id', input.applicationId)
      .eq('job_id', TAX_CAREER_JOB)
      .maybeSingle();
    if (application.error) throw Error('APPLICATION_LOOKUP_FAILED');
    if (!application.data?.user_id)
      return taxJson({ error: 'APPLICATION_NOT_FOUND' }, { status: 404 });
    const targetId = application.data.user_id;
    // Resolve the existing signed-up identity; never create accounts, temporary
    // passwords or staff identities from an applicant-supplied email address.
    const identity = await db.auth.admin.getUserById(targetId);
    if (identity.error || !identity.data?.user?.email || !identity.data.user.email_confirmed_at)
      return taxJson({ error: 'VERIFIED_ACCOUNT_REQUIRED' }, { status: 409 });
    const existing = await db
      .from('tax_preparers')
      .select('id,office_id,status')
      .eq('user_id', targetId)
      .maybeSingle();
    if (existing.error) throw Error('AGENT_LOOKUP_FAILED');
    if (existing.data) return taxJson({ error: 'AGENT_ALREADY_LINKED' }, { status: 409 });
    const inserted = await db
      .from('tax_preparers')
      .insert({
        user_id: targetId,
        office_id: input.officeId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: identity.data.user.email,
        ptin: input.ptin,
        status: 'pending',
        efin_authorized: false,
        ero_authorized: false,
        created_by: user.id,
        notes: JSON.stringify({
          applicationId: application.data.id,
          linkedBy: user.id,
          linkedAt: new Date().toISOString(),
          identityAndPtinVerified: true,
        }),
      })
      .select('id,status')
      .single();
    if (inserted.error?.code === '23505')
      return taxJson({ error: 'AGENT_ALREADY_LINKED' }, { status: 409 });
    if (inserted.error || !inserted.data) throw Error('AGENT_LINK_FAILED');
    return taxJson(
      {
        agent: inserted.data,
        message: 'Linked for onboarding. Production access remains pending.',
      },
      { status: 201 },
    );
  } catch (e) {
    return taxJson(
      { error: e instanceof OfficeAccessError ? e.code : 'AGENT_LINK_FAILED' },
      { status: e instanceof OfficeAccessError ? e.status : 500 },
    );
  }
}
