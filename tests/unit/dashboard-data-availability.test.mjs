import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardDataNotice, hasUnavailableInvoiceTotals } from '../../lib/admin/dashboard/data-availability.mjs';

test('the live missing-date snapshot requires invoice reconciliation', () => {
  assert.equal(hasUnavailableInvoiceTotals({ allTimeAvailable: true, monthAvailable: false }), true);
  const notice = dashboardDataNotice(['paid_invoices']);
  assert.equal(notice.critical, false);
  assert.equal(notice.href, '/integrations/quickbooks');
  assert.match(notice.title, /invoice totals/i);
  assert.match(notice.detail, /missing payment dates/i);
  assert.match(notice.detail, /not zero/i);
});
test('available invoice totals do not degrade the dashboard', () => {
  assert.equal(hasUnavailableInvoiceTotals({ allTimeAvailable: true, monthAvailable: true }), false);
  assert.equal(dashboardDataNotice([]), null);
});
test('missing and invalid invoice snapshots remain unavailable', () => {
  assert.equal(hasUnavailableInvoiceTotals(null), true);
  assert.equal(hasUnavailableInvoiceTotals({ allTimeAvailable: false, monthAvailable: true }), true);
});
test('a genuine dashboard source failure takes precedence over billing warnings', () => {
  const notice = dashboardDataNotice(['paid_invoices', 'dashboard_data']);
  assert.equal(notice.critical, true);
  assert.equal(notice.href, '/system-health');
});
test('other section failures keep a visible warning', () => {
  assert.equal(dashboardDataNotice(['recent_students']).critical, false);
  assert.equal(dashboardDataNotice(['recent_students']).href, '/system-health');
});
