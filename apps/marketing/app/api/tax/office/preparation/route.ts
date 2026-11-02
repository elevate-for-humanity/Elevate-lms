// pre-auth-registry: exempt - expertAccess requires verified identity, MFA and active office membership; every operation enforces office and preparer ownership.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { expertAccess } from '@/lib/tax-software/server/expert-access';
import { OfficeAccessError } from '@/lib/tax-software/server/office-access';
import { taxJson } from '@/lib/tax-software/server/response';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { federalInputSchema } from '@/lib/tax-software/calculation/input-schema';
import { prepareStoredFederalReturn2026 } from '@/lib/tax-software/calculation/financial-inputs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const filing = z.enum([
  'single',
  'married_joint',
  'married_separate',
  'head_of_household',
  'qualifying_surviving_spouse',
]);
const dollars = z.number().finite().min(0).max(1_000_000_000);
export const officeWorksheetSchema = z
  .object({
    w2: z
      .array(
        z
          .object({
            employerName: z.string().trim().min(1).max(120),
            owner: z.enum(['primary', 'spouse']),
            wages: dollars,
            federalWithholding: dollars,
            socialSecurityWages: dollars.optional(),
            medicareWages: dollars.optional(),
            socialSecurityTax: dollars.optional(),
            medicareTax: dollars.optional(),
          })
          .strict(),
      )
      .max(30),
    extra: federalInputSchema,
  })
  .strict();
const schema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('create_client'),
      officeId: z.string().uuid(),
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      email: z.string().email().max(200).or(z.literal('')),
      phone: z.string().trim().max(30),
    })
    .strict(),
  z
    .object({
      action: z.literal('start_return'),
      officeId: z.string().uuid(),
      clientId: z.string().uuid(),
      filingStatus: filing,
      taxYear: z.literal(2026),
    })
    .strict(),
  z
    .object({
      action: z.literal('save_return'),
      returnId: z.string().uuid(),
      expectedUpdatedAt: z.string().datetime(),
      worksheet: officeWorksheetSchema,
      submitForReview: z.boolean(),
    })
    .strict(),
]);
function fail(e: unknown) {
  return taxJson(
    { error: e instanceof OfficeAccessError ? e.code : 'PREPARATION_UNAVAILABLE' },
    { status: e instanceof OfficeAccessError ? e.status : 500 },
  );
}
async function scopedReturn(c: Awaited<ReturnType<typeof expertAccess>>, id: string) {
  const r = await c.db
    .from('tax_returns')
    .select(
      'id,client_id,office_id,preparer_user_id,tax_year,filing_status,status,return_json,updated_at',
    )
    .eq('id', id)
    .eq('service_type', 'professional')
    .in('office_id', c.officeIds)
    .maybeSingle();
  if (r.error) throw Error('RETURN_LOOKUP_FAILED');
  if (
    !r.data ||
    !c.officeIds.includes(r.data.office_id) ||
    (!c.ownedIds.includes(r.data.office_id) && r.data.preparer_user_id !== c.user.id)
  )
    throw new OfficeAccessError(404, 'RETURN_NOT_FOUND');
  return r.data;
}
export async function GET(req: NextRequest) {
  try {
    const c = await expertAccess();
    const id = req.nextUrl.searchParams.get('returnId');
    if (id) {
      if (!z.string().uuid().safeParse(id).success)
        return taxJson({ error: 'INVALID_RETURN' }, { status: 400 });
      const r = await scopedReturn(c, id);
      const client = await c.db
        .from('tax_clients')
        .select('id,first_name,last_name,email,phone')
        .eq('id', r.client_id)
        .eq('office_id', r.office_id)
        .maybeSingle();
      if (client.error) throw Error('CLIENT_READ_FAILED');
      return taxJson({
        return: {
          id: r.id,
          tax_year: r.tax_year,
          filing_status: r.filing_status,
          status: r.status,
          updated_at: r.updated_at,
          worksheet: r.return_json?.officeWorksheet ?? { w2: [], extra: {} },
          calculation: r.return_json?.officeCalculation ?? null,
        },
        client: client.data,
      });
    }
    const batches = await Promise.all(
      c.officeIds.map(async (officeId: string) => {
        let clients = c.db
          .from('tax_clients')
          .select('id,office_id,first_name,last_name,email,phone')
          .eq('office_id', officeId)
          .order('created_at', { ascending: false })
          .limit(100);
        let returns = c.db
          .from('tax_returns')
          .select(
            'id,client_id,office_id,preparer_user_id,tax_year,filing_status,status,updated_at',
          )
          .eq('office_id', officeId)
          .eq('service_type', 'professional')
          .order('updated_at', { ascending: false })
          .limit(100);
        if (!c.ownedIds.includes(officeId)) {
          clients = clients.eq('preparer_id', c.user.id);
          returns = returns.eq('preparer_user_id', c.user.id);
        }
        const [a, b] = await Promise.all([clients, returns]);
        if (a.error || b.error) throw Error('WORKLIST_READ_FAILED');
        return { clients: a.data ?? [], returns: b.data ?? [] };
      }),
    );
    return taxJson({
      offices: c.offices,
      clients: batches.flatMap((b) => b.clients),
      returns: batches.flatMap((b) => b.returns),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  try {
    const c = await expertAccess();
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return taxJson({ error: 'INVALID_PREPARATION_REQUEST' }, { status: 400 });
    const b = parsed.data;
    if (b.action === 'create_client') {
      if (!c.officeIds.includes(b.officeId))
        throw new OfficeAccessError(403, 'OFFICE_ACCESS_REQUIRED');
      const saved = await c.db
        .from('tax_clients')
        .insert({
          office_id: b.officeId,
          preparer_id: c.user.id,
          first_name: b.firstName,
          last_name: b.lastName,
          email: b.email || null,
          phone: b.phone || null,
          display_name: b.firstName + ' ' + b.lastName,
          source_system: 'supersonic',
        })
        .select('id')
        .single();
      if (saved.error || !saved.data) throw Error('CLIENT_SAVE_FAILED');
      return taxJson({ clientId: saved.data.id }, { status: 201 });
    }
    if (b.action === 'start_return') {
      if (!c.officeIds.includes(b.officeId))
        throw new OfficeAccessError(403, 'OFFICE_ACCESS_REQUIRED');
      let q = c.db
        .from('tax_clients')
        .select('id')
        .eq('id', b.clientId)
        .eq('office_id', b.officeId);
      if (!c.ownedIds.includes(b.officeId)) q = q.eq('preparer_id', c.user.id);
      const client = await q.maybeSingle();
      if (client.error) throw Error('CLIENT_LOOKUP_FAILED');
      if (!client.data) throw new OfficeAccessError(404, 'CLIENT_NOT_FOUND');
      const saved = await c.db
        .from('tax_returns')
        .insert({
          client_id: b.clientId,
          office_id: b.officeId,
          created_by_user_id: c.user.id,
          preparer_user_id: c.user.id,
          tax_year: b.taxYear,
          filing_status: b.filingStatus,
          service_type: 'professional',
          status: 'in_progress',
          return_json: { officeWorksheet: { w2: [], extra: {} } },
        })
        .select('id')
        .single();
      if (saved.error || !saved.data) throw Error('RETURN_CREATE_FAILED');
      return taxJson({ returnId: saved.data.id }, { status: 201 });
    }
    const r = await scopedReturn(c, b.returnId);
    if (!['in_progress', 'in_review'].includes(r.status) || r.tax_year !== 2026)
      return taxJson({ error: 'RETURN_NOT_EDITABLE' }, { status: 409 });
    if (r.filing_status !== 'married_joint' && b.worksheet.w2.some((w) => w.owner === 'spouse'))
      return taxJson({ error: 'SPOUSE_REQUIRES_JOINT_RETURN' }, { status: 400 });
    let calculation;
    try {
      calculation = prepareStoredFederalReturn2026({
        filingStatus: filing.parse(r.filing_status),
        extra: b.worksheet.extra,
        w2: b.worksheet.w2.map((w) => ({
          income_owner: w.owner,
          wages: w.wages,
          federal_withholding: w.federalWithholding,
          social_security_wages: w.socialSecurityWages,
          medicare_wages: w.medicareWages,
          social_security_tax: w.socialSecurityTax,
          medicare_tax: w.medicareTax,
        })),
        income1099: [],
        scheduleC: [],
        itemized: null,
      }).calculation;
    } catch {
      return taxJson({ error: 'REVIEW_FINANCIAL_INPUTS' }, { status: 400 });
    }
    const now = new Date().toISOString();
    const saved = await c.db
      .from('tax_returns')
      .update({
        return_json: {
          ...r.return_json,
          officeWorksheet: b.worksheet,
          officeCalculation: calculation,
          officeWorksheetSavedBy: c.user.id,
        },
        status: b.submitForReview ? 'in_review' : 'in_progress',
        updated_at: now,
      })
      .eq('id', r.id)
      .eq('service_type', 'professional')
      .eq('updated_at', b.expectedUpdatedAt)
      .select('id,updated_at')
      .maybeSingle();
    if (saved.error) throw Error('RETURN_SAVE_FAILED');
    if (!saved.data) return taxJson({ error: 'RETURN_CHANGED_RELOAD' }, { status: 409 });
    return taxJson({
      saved: true,
      updatedAt: saved.data.updated_at,
      calculation,
      status: b.submitForReview ? 'in_review' : 'in_progress',
    });
  } catch (e) {
    return fail(e);
  }
}
