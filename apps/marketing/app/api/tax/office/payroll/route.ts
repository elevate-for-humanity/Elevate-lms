// pre-auth-registry: exempt - expertAccess verifies identity/MFA; each operation additionally requires active office ownership.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { expertAccess } from '@/lib/tax-software/server/expert-access';
import { OfficeAccessError } from '@/lib/tax-software/server/office-access';
import { taxJson } from '@/lib/tax-software/server/response';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  calculatePayrollDraft,
  employeePayrollSchema,
  payrollDraftSchema,
} from '@/lib/payroll/supersonic-2026';
import { payrollReviewCsv } from '@/lib/payroll/review-export';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const uuid = z.string().uuid(),
  version = z.number().int().positive();
const schema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('create_company'),
      officeId: uuid,
      name: z.string().trim().min(1).max(160),
      frequency: z.enum(['weekly', 'biweekly', 'semimonthly', 'monthly']),
    })
    .strict(),
  z
    .object({
      action: z.literal('save_employee'),
      companyId: uuid,
      expectedVersion: version,
      employee: employeePayrollSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('save_run'),
      companyId: uuid,
      expectedVersion: version,
      runId: uuid,
      expectedRunVersion: version.nullable(),
      input: payrollDraftSchema,
    })
    .strict(),
  z
    .object({
      action: z.literal('review_run'),
      companyId: uuid,
      runId: uuid,
      expectedRunVersion: version,
      decision: z.enum(['approve', 'void']),
    })
    .strict(),
]);
async function context() {
  const c = await expertAccess();
  if (!c.ownedIds.length) throw new OfficeAccessError(403, 'PAYROLL_OWNER_REQUIRED');
  return c;
}
async function company(c: Awaited<ReturnType<typeof context>>, id: string) {
  const r = await c.db
    .from('sfc_payroll_companies')
    .select('*')
    .eq('id', id)
    .in('office_id', c.ownedIds)
    .maybeSingle();
  if (r.error) throw Error('PAYROLL_READ_FAILED');
  if (!r.data || !c.ownedIds.includes(r.data.office_id))
    throw new OfficeAccessError(404, 'COMPANY_NOT_FOUND');
  return r.data;
}
function fail(e: unknown) {
  return taxJson(
    {
      error:
        e instanceof OfficeAccessError
          ? e.code
          : 'Payroll could not be saved. Reload before retrying.',
    },
    { status: e instanceof OfficeAccessError ? e.status : 503 },
  );
}
export async function GET(req: NextRequest) {
  try {
    const c = await context(),
      id = req.nextUrl.searchParams.get('companyId');
    if (!id) {
      const r = await c.db
        .from('sfc_payroll_companies')
        .select('id,office_id,legal_name,frequency,version')
        .in('office_id', c.ownedIds)
        .order('legal_name')
        .limit(100);
      if (r.error) throw Error('PAYROLL_READ_FAILED');
      return taxJson({
        companies: r.data ?? [],
        offices: c.offices.filter((o: { id: string }) => c.ownedIds.includes(o.id)),
        paymentsEnabled: false,
        taxFilingEnabled: false,
      });
    }
    if (!uuid.safeParse(id).success) return taxJson({ error: 'INVALID_COMPANY' }, { status: 400 });
    const current = await company(c, id);
    const runId = req.nextUrl.searchParams.get('runId');
    const q = c.db.from('sfc_payroll_runs').select('*').eq('company_id', id);
    if (runId) {
      if (!uuid.safeParse(runId).success) return taxJson({ error: 'INVALID_RUN' }, { status: 400 });
      const r = await q.eq('id', runId).maybeSingle();
      if (r.error) throw Error('PAYROLL_READ_FAILED');
      if (!r.data) return taxJson({ error: 'RUN_NOT_FOUND' }, { status: 404 });
      if (req.nextUrl.searchParams.get('download') === 'csv') {
        return new NextResponse(payrollReviewCsv(current.legal_name, r.data), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="payroll-review-${runId}.csv"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            Vary: 'Cookie',
          },
        });
      }
      return taxJson({
        company: current,
        run: r.data,
        paymentsEnabled: false,
        taxFilingEnabled: false,
      });
    }
    const runs = await q.order('created_at', { ascending: false }).limit(100);
    if (runs.error) throw Error('PAYROLL_READ_FAILED');
    return taxJson({
      company: current,
      runs: runs.data ?? [],
      paymentsEnabled: false,
      taxFilingEnabled: false,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (
    req.headers.get('sec-fetch-site') === 'cross-site' ||
    (origin && origin !== req.nextUrl.origin)
  )
    return taxJson({ error: 'SAME_ORIGIN_REQUIRED' }, { status: 403 });
  const limited = await applyRateLimit(req, 'api');
  if (limited) return limited;
  try {
    const c = await context();
    const raw = await req.text();
    if (raw.length > 200_000) return taxJson({ error: 'REQUEST_TOO_LARGE' }, { status: 413 });
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      return taxJson({ error: 'INVALID_PAYROLL_REQUEST' }, { status: 400 });
    }
    const p = schema.safeParse(value);
    if (!p.success)
      return taxJson(
        {
          error: 'Review payroll fields, dates and supported wage arrangements.',
          issues: p.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
        { status: 400 },
      );
    const b = p.data;
    if (b.action === 'create_company') {
      if (!c.ownedIds.includes(b.officeId))
        throw new OfficeAccessError(403, 'PAYROLL_OWNER_REQUIRED');
      const saved = await c.db
        .from('sfc_payroll_companies')
        .insert({ office_id: b.officeId, legal_name: b.name, frequency: b.frequency })
        .select('id')
        .single();
      if (saved.error || !saved.data) throw Error('PAYROLL_SAVE_FAILED');
      return taxJson({ companyId: saved.data.id }, { status: 201 });
    }
    const current = await company(c, b.companyId);
    if (b.action === 'save_employee') {
      if (current.version !== b.expectedVersion)
        return taxJson({ error: 'PAYROLL_CHANGED_RELOAD' }, { status: 409 });
      if (b.employee.frequency !== current.frequency)
        return taxJson({ error: 'PAY_FREQUENCY_MISMATCH' }, { status: 400 });
      const employees = z
        .array(employeePayrollSchema)
        .max(100)
        .parse(current.employees ?? []);
      if (
        employees.some(
          (e) =>
            e.id !== b.employee.id &&
            e.reference.toLowerCase() === b.employee.reference.toLowerCase(),
        )
      )
        return taxJson({ error: 'EMPLOYEE_REFERENCE_EXISTS' }, { status: 409 });
      const next = [...employees.filter((e) => e.id !== b.employee.id), b.employee];
      if (next.length > 100) return taxJson({ error: 'COMPANY_EMPLOYEE_LIMIT' }, { status: 422 });
      const r = await c.db
        .from('sfc_payroll_companies')
        .update({
          employees: next,
          version: current.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', b.companyId)
        .eq('version', b.expectedVersion)
        .select('id,version')
        .maybeSingle();
      if (r.error) throw Error('PAYROLL_SAVE_FAILED');
      if (!r.data) return taxJson({ error: 'PAYROLL_CHANGED_RELOAD' }, { status: 409 });
      return taxJson({ saved: true, version: r.data.version });
    }
    if (b.action === 'save_run') {
      if (current.version !== b.expectedVersion)
        return taxJson({ error: 'PAYROLL_CHANGED_RELOAD' }, { status: 409 });
      let calculation;
      try {
        calculation = calculatePayrollDraft(
          z.array(employeePayrollSchema).parse(current.employees),
          b.input,
        );
      } catch (e) {
        return taxJson(
          { error: e instanceof Error ? e.message : 'Review payroll inputs' },
          { status: 422 },
        );
      }
      const r = await c.db.rpc('sfc_save_payroll_run', {
        p_actor: c.user.id,
        p_company: b.companyId,
        p_source_version: b.expectedVersion,
        p_run: b.runId,
        p_expected_version: b.expectedRunVersion,
        p_input: b.input,
        p_calculation: calculation,
      });
      if (r.error)
        return taxJson(
          {
            error:
              'Payroll changed or this period already exists. Reload and review the saved run.',
          },
          { status: 409 },
        );
      const run = Array.isArray(r.data) ? r.data[0] : r.data;
      if (!run) throw Error('PAYROLL_SAVE_FAILED');
      return taxJson({ saved: true, run, paymentsSent: false, taxesFiled: false });
    }
    const r = await c.db.rpc('sfc_review_payroll_run', {
      p_actor: c.user.id,
      p_company: b.companyId,
      p_run: b.runId,
      p_expected_version: b.expectedRunVersion,
      p_action: b.decision,
    });
    if (r.error)
      return taxJson(
        { error: 'Payroll or employee details changed. Reload and recalculate before approving.' },
        { status: 409 },
      );
    const run = Array.isArray(r.data) ? r.data[0] : r.data;
    if (!run) throw Error('PAYROLL_REVIEW_FAILED');
    return taxJson({ run, paymentsSent: false, taxesFiled: false });
  } catch (e) {
    return fail(e);
  }
}
