import { nextInvoiceDate } from './schedule';

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
  paymentUrl: string | null;
};

type Database = any;

export async function listApprenticeInvoices(
  db: Database,
  userId: string,
  limit = 50,
): Promise<ApprenticeDashboardInvoice[]> {
  const { data, error } = await db
    .from('billing_invoices')
    .select('id,invoice_number,total_cents,status,due_at,payment_url')
    .in('customer_external_key', [userId, `user:${userId}`])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load apprentice invoices: ${error.message}`);
  return (data || []).map((row: any) => ({
    id: row.id,
    invoiceNumber: row.invoice_number || null,
    amountCents: Number(row.total_cents || 0),
    status: String(row.status || 'open'),
    dueDate: row.due_at || null,
    paymentUrl: row.payment_url || null,
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
    suspended: overdueInvoices.length > 0 && !exemption.data?.expires_at,
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
      <div style="border:2px solid #dc2626;border-radius:8px;background:#fef2f2;padding:14px;color:#7f1d1d"><strong>Account access warning:</strong> If an invoice remains unpaid after its due date, your course account will be suspended, active sessions will be signed out, and you will not be able to sign in again until every past-due invoice is paid.</div>
      <p style="font-size:13px;color:#475569">This invoice is the temporary weekly billing path while your PayPal recurring-payment agreement is being activated. It does not create a duplicate automatic charge.</p>
      <p style="font-size:13px;color:#475569">Questions? Reply to this email or contact billing@elevateforhumanity.org.</p>
    </div>`,
    text: `Hi ${input.customerName},\n\nYour ${input.productName} invoice${invoiceLabel} for ${amount} is ready. Every invoice currently due is listed below:\n\n${textInvoices}\n\nACCOUNT ACCESS WARNING: If an invoice remains unpaid after its due date, your course account will be suspended, active sessions will be signed out, and you will not be able to sign in again until every past-due invoice is paid.\n\nThis invoice is the temporary weekly billing path while your PayPal recurring-payment agreement is being activated. It does not create a duplicate automatic charge.\n\nQuestions: billing@elevateforhumanity.org`,
  };
}
