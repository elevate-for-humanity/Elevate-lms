/** Public presentation and validation only; provider credentials never belong here. */
export const SERVICE_BILLING_PATH = '/operations/infrastructure-costs#service-billing';
export const SERVICE_BILLING_PREFIX = 'service_billing:';
export const BILLING_SERVICES = [
  {
    id: 'google-ads',
    name: 'Google Ads',
    purpose: 'Advertising account billing; verify grant and paid accounts separately',
    url: 'https://ads.google.com/',
    linkLabel: 'Open Google Ads → Billing → Summary',
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads',
    purpose: 'Facebook and Instagram advertising account billing',
    url: 'https://business.facebook.com/',
    linkLabel: 'Open Business Suite → Billing & payments',
  },
  {
    id: 'openhands',
    name: 'OpenHands Cloud',
    purpose: 'Cloud engineering conversations and execution credits',
    url: 'https://app.all-hands.dev/',
    linkLabel: 'Open account → Billing',
  },
  {
    id: 'livekit',
    name: 'LiveKit Cloud',
    purpose: 'Video calling, sessions and agent usage',
    url: 'https://cloud.livekit.io/',
    linkLabel: 'Open project → Billing',
  },
  {
    id: 'github',
    name: 'GitHub',
    purpose: 'Organization plans, Actions and storage usage',
    url: 'https://github.com/settings/billing',
    linkLabel: 'Open billing and licensing',
  },
  {
    id: 'google-cloud',
    name: 'Google Cloud',
    purpose: 'Website, LMS, Admin and media workers',
    url: 'https://console.cloud.google.com/billing?project=elegant-racer-299721',
    linkLabel: 'Open Cloud billing',
  },
  {
    id: 'supabase',
    name: 'Supabase',
    purpose: 'Database, authentication and storage',
    url: 'https://supabase.com/dashboard/org/_/billing#invoices',
    linkLabel: 'Open invoices and payment methods',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    purpose: 'Business email and Workspace subscriptions',
    url: 'https://admin.google.com/ac/billing',
    linkLabel: 'Open Workspace billing',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    purpose: 'Phone numbers, calls and messages',
    url: 'https://console.twilio.com/',
    linkLabel: 'Open Console → Billing → Add funds',
  },
  {
    id: 'macroscope',
    name: 'Macroscope',
    purpose: 'Independent code reviews and agents',
    url: 'https://app.macroscope.com/settings/billing',
    linkLabel: 'Open billing and top up',
  },
  {
    id: 'tinyfish',
    name: 'TinyFish',
    purpose: 'Browser and agent wallet',
    url: 'https://agent.tinyfish.ai/',
    linkLabel: 'Open account → Wallet',
  },
  {
    id: 'devin',
    name: 'Devin',
    purpose: 'Engineering agents and review capacity',
    url: 'https://app.devin.ai/',
    linkLabel: 'Open account → Billing',
  },
  {
    id: 'openai',
    name: 'OpenAI / Codex',
    purpose: 'AI usage and code-review limits',
    url: 'https://chatgpt.com/codex/settings/usage',
    linkLabel: 'Open Codex usage and limits',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    purpose: 'Inbound and outbound email',
    url: 'https://app.sendgrid.com/',
    linkLabel: 'Open account → Settings → Billing',
  },
  {
    id: 'resend',
    name: 'Resend',
    purpose: 'Email delivery where configured',
    url: 'https://resend.com/',
    linkLabel: 'Open account → Billing',
  },
  {
    id: 'backblaze',
    name: 'Backblaze B2',
    purpose: 'Media and file storage',
    url: 'https://secure.backblaze.com/',
    linkLabel: 'Open account → Billing',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    purpose: 'DNS, edge services and AI',
    url: 'https://dash.cloudflare.com/',
    linkLabel: 'Open account → Billing',
  },
] as const;
export type BillingServiceId = (typeof BILLING_SERVICES)[number]['id'];
export type ServiceBillingRecord = {
  serviceId: BillingServiceId;
  revision: string;
  enabled: boolean;
  currency: 'USD';
  balance: number | null;
  warningBalance: number;
  criticalBalance: number;
  amountDue: number | null;
  dueDate: string | null;
  paymentStatus: 'unknown' | 'due' | 'failed' | 'paid';
  warningDays: number;
  observedAt: string;
  source: 'manual' | 'provider';
  reference: string;
  notes: string;
  autoRefresh?: boolean;
  balanceCheckedAt?: string;
  balanceError?: 'not_configured' | 'unavailable';
};
export type BillingSignal = {
  kind: string;
  severity: 'warning' | 'critical';
  message: string;
  episode: string;
};
const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
export function easternDate(now: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
function validDay(s: unknown): s is string {
  return (
    typeof s === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s).toISOString().slice(0, 10) === s
  );
}
export function validateServiceBilling(
  input: unknown,
  now = Date.now(),
): Omit<ServiceBillingRecord, 'revision' | 'source'> {
  const x = input as ServiceBillingRecord;
  const notes = typeof x?.notes === 'string' ? x.notes.replace(/[\r\n]+/g, ' ') : x?.notes;
  const amount = (n: unknown, negative = false) =>
    n === null ||
    (typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 1e9 && (negative || n >= 0));
  if (
    !x ||
    !BILLING_SERVICES.some((s) => s.id === x.serviceId) ||
    typeof x.enabled !== 'boolean' ||
    (x.autoRefresh !== undefined && typeof x.autoRefresh !== 'boolean') ||
    x.currency !== 'USD' ||
    !amount(x.balance, true) ||
    !amount(x.amountDue) ||
    !amount(x.warningBalance) ||
    x.warningBalance === null ||
    !amount(x.criticalBalance) ||
    x.criticalBalance === null ||
    x.warningBalance < x.criticalBalance ||
    !['unknown', 'due', 'failed', 'paid'].includes(x.paymentStatus) ||
    (x.dueDate !== null && !validDay(x.dueDate)) ||
    !Number.isInteger(x.warningDays) ||
    x.warningDays < 1 ||
    x.warningDays > 90 ||
    typeof x.observedAt !== 'string' ||
    !Number.isFinite(Date.parse(x.observedAt)) ||
    Date.parse(x.observedAt) > now + 300000 ||
    typeof x.reference !== 'string' ||
    !/^[\w .:#/-]{0,120}$/.test(x.reference) ||
    typeof notes !== 'string' ||
    notes.length > 500 ||
    /https?:\/\//i.test(notes) ||
    [...notes].some((char) => char.charCodeAt(0) < 32)
  )
    throw new Error('SERVICE_BILLING_INVALID');
  // Pick fields explicitly. Ignore supplied URLs, credentials, actor and revision.
  return {
    serviceId: x.serviceId,
    enabled: x.enabled,
    currency: 'USD',
    balance: x.balance,
    warningBalance: x.warningBalance,
    criticalBalance: x.criticalBalance,
    amountDue: x.amountDue,
    dueDate: x.dueDate,
    paymentStatus: x.paymentStatus,
    warningDays: x.warningDays,
    observedAt: new Date(x.observedAt).toISOString(),
    reference: x.reference,
    notes,
    autoRefresh: x.serviceId === 'twilio' && x.autoRefresh === true,
  };
}
export function billingSignals(record: ServiceBillingRecord, now = Date.now()): BillingSignal[] {
  if (!record.enabled) return [];
  const out: BillingSignal[] = [];
  const day = easternDate(now);
  const balanceStale =
    now - Date.parse(record.balanceCheckedAt || record.observedAt) > 86400000 ||
    !Number.isFinite(Date.parse(record.observedAt));
  const stale =
    balanceStale ||
    (record.paymentStatus !== 'unknown' && now - Date.parse(record.observedAt) > 86400000);
  if (record.paymentStatus === 'failed')
    out.push({
      kind: 'payment-failed',
      severity: 'critical',
      message: 'The last recorded payment failed. Open billing to resolve it.',
      episode: record.reference || record.dueDate || record.observedAt.slice(0, 10),
    });
  if (record.paymentStatus === 'due' && record.dueDate) {
    const days = Math.round((Date.parse(record.dueDate) - Date.parse(day)) / 86400000);
    if (days <= record.warningDays)
      out.push({
        kind: days < 0 ? 'overdue' : days <= 1 ? 'due-now' : 'due-soon',
        severity: days <= 1 ? 'critical' : 'warning',
        message: `${record.amountDue === null ? 'A payment' : money(record.amountDue)} ${days < 0 ? 'is overdue' : days === 0 ? 'is due today' : `is due in ${days} day${days === 1 ? '' : 's'}`} (${record.dueDate}, Eastern).`,
        episode: record.dueDate,
      });
  }
  // A paid invoice is not evidence that a prepaid wallet has enough funds.
  if (record.balanceError)
    out.push({
      kind: 'balance-connection',
      severity: 'warning',
      message:
        'Automatic balance refresh is unavailable. Check provider billing; the previous balance is not current.',
      episode: record.balanceError,
    });
  if (record.balance !== null && record.balance <= record.warningBalance)
    out.push({
      kind: record.balance <= record.criticalBalance ? 'balance-critical' : 'balance-low',
      severity: record.balance <= record.criticalBalance ? 'critical' : 'warning',
      message: `${balanceStale ? 'Last recorded' : 'Recorded'} available balance is ${money(record.balance)}. Check or replenish the wallet.`,
      episode: `${record.balance <= record.criticalBalance ? record.criticalBalance : record.warningBalance}`,
    });
  const prepaid = ['twilio', 'macroscope', 'tinyfish', 'devin', 'openhands'].includes(
    record.serviceId,
  );
  if (
    stale ||
    (record.balance === null && (prepaid || record.paymentStatus === 'unknown')) ||
    (record.paymentStatus === 'due' && (record.amountDue === null || record.dueDate === null))
  )
    out.push({
      kind: 'verification-needed',
      severity: 'warning',
      message: stale
        ? 'Billing evidence is over 24 hours old. Verify the current balance and payment status.'
        : 'Balance and payment status have not been verified.',
      episode: stale ? record.observedAt.slice(0, 10) : 'unknown',
    });
  return out;
}
