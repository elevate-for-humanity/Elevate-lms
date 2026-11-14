/** Preserve unavailable financial totals while identifying their affected section. */
export function hasUnavailableInvoiceTotals(totals) {
  return totals?.allTimeAvailable !== true || totals?.monthAvailable !== true;
}

export function dashboardDataNotice(sections = []) {
  if (!sections.length) return null;
  if (sections.includes('dashboard_data')) {
    return {
      critical: true,
      title: 'Some live dashboard data could not be loaded.',
      detail: 'Review System Health before acting on unavailable counts or missing records.',
      href: '/system-health',
      action: 'Open System Health',
    };
  }
  if (sections.includes('paid_invoices')) {
    return {
      critical: false,
      title: 'Paid invoice totals need reconciliation.',
      detail: 'A paid invoice total is unavailable. Check for missing payment dates, invalid amounts or currencies, or an invoice connection error. Unavailable totals are not zero.',
      href: '/integrations/quickbooks',
      action: 'Review QuickBooks invoices',
    };
  }
  return {
    critical: false,
    title: 'Some dashboard sections are temporarily unavailable.',
    detail: 'Open System Health for the current dependency status before acting on missing data.',
    href: '/system-health',
    action: 'Open System Health',
  };
}
