/** Display the canonical payout account, never the holder's legacy setup snapshot. */
export function payoutSetupLabel(account: {
  payout_provider?: string | null;
  verification_status?: string | null;
  payouts_enabled?: boolean;
  transfers_enabled?: boolean;
} | null | undefined): string {
  if (!account?.payout_provider) return 'Not started';
  const provider = ({ paypal: 'PayPal', quickbooks: 'QuickBooks', branch: 'Branch' } as Record<string, string>)[account.payout_provider] || 'Payout account';
  const status = account.verification_status || 'not_started';
  const labels: Record<string, string> = {
    not_started: 'Not started',
    banking_required: 'Banking setup required',
    pending: 'Pending review',
    restricted: 'Restricted — contact Elevate',
    vendor_active_payment_pending: 'Vendor active; payment pending',
    active: account.payouts_enabled && account.transfers_enabled ? 'Verified account' : 'Verification incomplete',
  };
  return `${provider} — ${labels[status] || status.replaceAll('_', ' ')}`;
}
