import { invoiceBelongsToUser } from './invoice-checkout';
import { nextInvoiceDate } from './schedule';
import { invoiceLineDescriptions, isIssuedStudentInvoice } from './invoice-display';

export type ApprenticeInvoiceEmailInput = {
  customerName: string;
  productName: string;
  invoiceNumber?: string;
  amountCents: number;
  dueDate: string;
  paymentUrl?: string;
  openInvoices?: ApprenticeDashboardInvoice[];
};

export type ApprenticeDashboardInvoice = {
  id: string;
  invoiceNumber: string | null;
  amountCents: number;
  status: string;
  dueDate: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  paymentUrl: string | null;
  descriptions?: string[];
};

type Database = any;

export async function listApprenticeInvoices(
  db: Database,
  userId: string,
  limit = 50,
  accountEmail?: string | null,
): Promise<ApprenticeDashboardInvoice[]> {
  let email = accountEmail;
  if (email === undefined) {
    const profile = await db.from('profiles').select('email').eq('id', userId).maybeSingle();
    if (profile.error) throw new Error(`Could not resolve apprentice billing identity: ${profile.error.message}`);
    email = profile.data?.email;
  }

  const select =
    'id,provider,provider_invoice_id,invoice_number,total_cents,status,due_at,paid_at,payment_url,created_at,customer_external_key,customer_email,provider_payload';
  const byUserKey = db
    .from('billing_invoices')
    .select(select)
    .in('customer_external_key', [userId, `user:${userId}`])
    .order('created_at', { ascending: false })
    .limit(limit);
  const byEmail = email
    ? db
        .from('billing_invoices')
        .select(select)
        .eq('customer_email', email)
        .order('created_at', { ascending: false })
        .limit(limit)
    : Promise.resolve({ data: [], error: null });
  const [keyResult, emailResult] = await Promise.all([byUserKey, byEmail]);
  const error = keyResult.error || emailResult.error;
  if (error) throw new Error(`Could not load apprentice invoices: ${error.message}`);

  // QuickBooks uses its own customer ID while Elevate uses the profile UUID.
  // Resolve both identities and de-duplicate by the canonical local invoice ID.
  const rows = new Map<string, any>();
  for (const row of emailResult.data || []) {
    if (invoiceBelongsToUser(row, userId, email)) rows.set(row.id, row);
  }
  for (const row of keyResult.data || []) rows.set(row.id, row);
  return [...rows.values()]
    .filter(isIssuedStudentInvoice)
    .sort((left, right) =>
      String(right.created_at || '').localeCompare(String(left.created_at || '')),
    )
    .slice(0, limit)
    .map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number || null,
      amountCents: Number(row.total_cents || 0),
      status: String(row.status || 'open'),
      dueDate: row.due_at || null,
      paidAt: row.paid_at || null,
      createdAt: row.created_at || null,
      paymentUrl: row.payment_url || null,
      descriptions: invoiceLineDescriptions(row.provider_payload),
    }));
}

export async function getApprenticeBillingAccess(
  db: Database,
  userId: string,
  today = new Date().toISOString().slice(0, 10),
): Promise<{
  isApprenticeBillingAccount: boolean;
  invoices: ApprenticeDashboardInvoice[];
  openInvoices: ApprenticeDashboardInvoice[];
  overdueInvoices: ApprenticeDashboardInvoice[];
  accessExemptUntil: string | null;
  suspended: boolean;
}> {
  const authorization = await db
    .from('billing_migration_authorizations')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (authorization.error) {
    throw new Error(`Could not verify apprentice billing account: ${authorization.error.message}`);
  }
  if (!authorization.data) {
    return {
      isApprenticeBillingAccount: false,
      invoices: [],
      openInvoices: [],
      overdueInvoices: [],
      accessExemptUntil: null,
      suspended: false,
    };
  }

  const [invoices, exemption] = await Promise.all([
    listApprenticeInvoices(db, userId),
    db
      .from('billing_access_exemptions')
      .select('expires_at')
      .eq('user_id', userId)
      .eq('status', 'active')
      .lte('starts_at', new Date().toISOString())
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (exemption.error) {
    throw new Error(`Could not verify billing access exemption: ${exemption.error.message}`);
  }
  const openStatuses = new Set(['draft', 'open', 'past_due', 'unpaid', 'pending']);
  const openInvoices = invoices.filter((invoice) => openStatuses.has(invoice.status.toLowerCase()));
  const overdueInvoices = openInvoices.filter(
    (invoice) =>
      invoice.status.toLowerCase() === 'past_due' ||
      Boolean(invoice.dueDate && invoice.dueDate < today),
  );
  return {
    isApprenticeBillingAccount: true,
    invoices,
    openInvoices,
    overdueInvoices,
    accessExemptUntil: exemption.data?.expires_at || null,
    // Tuition remains payable, but an invoice cannot suspend portal access.
    suspended: false,
  };
}

export function billingWeekStart(date: Date): string {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const daysSinceMonday = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - daysSinceMonday);
  return copy.toISOString().slice(0, 10);
}

export function nextWeeklyInvoiceDateAfter(current: string, through: string): string {
  let next = current;
  do {
    next = nextInvoiceDate(next, 'weekly');
  } while (next <= through);
  return next;
}

/** Last day (Sunday) of the billing week that starts on the given Monday. */
export function billingWeekEnd(weekStart: string): string {
  const [year, month, day] = weekStart.split('-').map(Number);
  const end = new Date(Date.UTC(year, month - 1, day));
  end.setUTCDate(end.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
}

/** Invoice statuses that still represent an amount owed for the week. */
export const OPEN_INVOICE_STATUSES = ['draft', 'open', 'past_due', 'unpaid', 'pending'] as const;
/** Invoice statuses that can receive an external payment for the week. */
export const PAYABLE_INVOICE_STATUSES = ['open', 'past_due', 'unpaid', 'pending'] as const;

export type ScheduleWeekInvoice = {
  id: string;
  provider_invoice_id: string | null;
  invoice_number: string | null;
  total_cents: number;
  status: string;
  due_at: string | null;
  idempotency_key?: string | null;
};

/**
 * Same-schedule / same-amount / same-week duplicate detector.
 *
 * A weekly tuition week must have exactly one invoice. The fallback writer and
 * the PayPal reconcile writer used different idempotency keys
 * (`apprentice-fallback:` vs `paypal:`), so neither could see the other's
 * invoice and students were charged twice for the same week. This is the
 * single shared lookup both writers must consult before creating an invoice:
 *
 * 1. Exact match on the deterministic fallback idempotency key
 *    (`apprentice-fallback:{scheduleId}:{weekStart}`) — catches fallback
 *    invoices created by any run, including rows written before
 *    `billing_schedule_id` was recorded on invoices.
 * 2. Any invoice linked to the schedule whose due date falls in the week and
 *    whose amount matches — catches reconcile-created (`paypal:`) invoices
 *    once they are linked to the schedule.
 *
 * Failed and voided invoice rows are ignored: a failed creation is retried,
 * not treated as a billed week, and a voided invoice is terminal — it can
 * neither take a payment nor stand in for the week, so a replacement invoice
 * may be created for that week instead of the payment failing outright.
 * Returns the earliest matching invoice, or null.
 */
export async function findInvoiceForScheduleWeek(
  db: Database,
  input: { scheduleId: string; amountCents: number; weekStart: string },
): Promise<ScheduleWeekInvoice | null> {
  const weekEnd = billingWeekEnd(input.weekStart);
  const select =
    'id,provider_invoice_id,invoice_number,total_cents,status,due_at,idempotency_key,created_at';
  const byKey = await db
    .from('billing_invoices')
    .select(select)
    .eq('idempotency_key', `apprentice-fallback:${input.scheduleId}:${input.weekStart}`)
    .eq('total_cents', input.amountCents)
    .neq('status', 'failed')
    .neq('status', 'void')
    .maybeSingle();
  if (byKey.error) throw new Error(`Could not check for a duplicate invoice: ${byKey.error.message}`);
  if (byKey.data) return byKey.data as ScheduleWeekInvoice;

  const bySchedule = await db
    .from('billing_invoices')
    .select(select)
    .eq('billing_schedule_id', input.scheduleId)
    .eq('total_cents', input.amountCents)
    .gte('due_at', input.weekStart)
    .lte('due_at', weekEnd)
    .neq('status', 'failed')
    .neq('status', 'void')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (bySchedule.error) {
    throw new Error(`Could not check for a duplicate invoice: ${bySchedule.error.message}`);
  }
  return (bySchedule.data as ScheduleWeekInvoice | null) ?? null;
}

export function apprenticeInvoiceIdempotencyKey(scheduleId: string, runAt: Date): string {
  return `apprentice-fallback:${scheduleId}:${billingWeekStart(runAt)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return replacements[character];
  });
}

export function apprenticeInvoiceEmail(input: ApprenticeInvoiceEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(input.amountCents / 100);
  const invoiceLabel = input.invoiceNumber ? ` #${input.invoiceNumber}` : '';
  const openInvoices = input.openInvoices?.length
    ? input.openInvoices
    : [
        {
          id: '',
          invoiceNumber: input.invoiceNumber || null,
          amountCents: input.amountCents,
          status: 'open',
          dueDate: input.dueDate,
          paymentUrl: input.paymentUrl || null,
        },
      ];
  const invoiceRows = openInvoices
    .map((invoice) => {
      const invoiceAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(invoice.amountCents / 100);
      const payLink = invoice.paymentUrl
        ? `<a href="${escapeHtml(invoice.paymentUrl)}" style="font-weight:700;color:#1d4ed8">Pay now</a>`
        : 'Open dashboard';
      return `<tr><td style="border-bottom:1px solid #e2e8f0;padding:10px 6px">${escapeHtml(invoice.invoiceNumber || 'Invoice')}</td><td style="border-bottom:1px solid #e2e8f0;padding:10px 6px">${escapeHtml(invoice.dueDate || 'Due now')}</td><td style="border-bottom:1px solid #e2e8f0;padding:10px 6px;text-align:right;font-weight:700">${invoiceAmount}</td><td style="border-bottom:1px solid #e2e8f0;padding:10px 6px;text-align:right">${payLink}</td></tr>`;
    })
    .join('');
  const textInvoices = openInvoices
    .map((invoice) => {
      const invoiceAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(invoice.amountCents / 100);
      return `${invoice.invoiceNumber || 'Invoice'} — ${invoiceAmount} — due ${invoice.dueDate || 'now'}${invoice.paymentUrl ? ` — Pay now: ${invoice.paymentUrl}` : ''}`;
    })
    .join('\n');

  return {
    subject: `Elevate tuition invoice${invoiceLabel} — ${amount}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:620px">
      <h2 style="margin-bottom:8px">Your weekly tuition invoice is ready</h2>
      <p>Hi ${escapeHtml(input.customerName)},</p>
      <p>We created your current <strong>${escapeHtml(input.productName)}</strong> invoice in QuickBooks and added it to your Elevate billing dashboard. Every invoice currently due is listed below.</p>
      <table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:14px">
        <thead><tr><th style="padding:8px 6px;text-align:left">Invoice</th><th style="padding:8px 6px;text-align:left">Due</th><th style="padding:8px 6px;text-align:right">Amount</th><th style="padding:8px 6px;text-align:right">Payment</th></tr></thead>
        <tbody>${invoiceRows}</tbody>
      </table>
      <div style="border:2px solid #f59e0b;border-radius:8px;background:#fffbeb;padding:14px;color:#78350f"><strong>Payment reminder:</strong> Review each invoice due date and Pay Now link. Your apprentice portal remains available while billing is resolved.</div>
      <p style="font-size:13px;color:#475569">This invoice is the temporary weekly billing path while your PayPal recurring-payment agreement is being activated. If your PayPal automatic payment for this week goes through, it is applied to this invoice instead of creating a second charge — you will not be charged twice for the same week.</p>
      <p style="font-size:13px;color:#475569">Questions? Reply to this email or contact billing@elevateforhumanity.org.</p>
    </div>`,
    text: `Hi ${input.customerName},\n\nYour ${input.productName} invoice${invoiceLabel} for ${amount} is ready. Every invoice currently due is listed below:\n\n${textInvoices}\n\nPAYMENT REMINDER: Review each invoice due date and Pay Now link. Your apprentice portal remains available while billing is resolved.\n\nThis invoice is the temporary weekly billing path while your PayPal recurring-payment agreement is being activated. If your PayPal automatic payment for this week goes through, it is applied to this invoice instead of creating a second charge — you will not be charged twice for the same week.\n\nQuestions: billing@elevateforhumanity.org`,
  };
}
