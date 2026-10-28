/** A failed QuickBooks draft with no provider invoice is an integration error,
 * not evidence that a student's payment failed. Preserve the original row. */
export function isIssuedStudentInvoice(invoice: {
  provider?: string | null;
  provider_invoice_id?: string | null;
  status?: string | null;
}) {
  return !(
    invoice.provider === 'quickbooks' &&
    invoice.status === 'failed' &&
    !invoice.provider_invoice_id
  );
}
