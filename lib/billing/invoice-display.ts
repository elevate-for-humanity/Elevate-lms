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

export function invoiceLineDescriptions(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object' || !('Line' in payload) || !Array.isArray(payload.Line)) {
    return [];
  }
  const descriptions = payload.Line.flatMap((line: unknown) => {
    if (!line || typeof line !== 'object' || !('DetailType' in line) ||
        line.DetailType !== 'SalesItemLineDetail' || !('Description' in line) ||
        typeof line.Description !== 'string') return [];
    const description = line.Description.trim();
    return description ? [description] : [];
  });
  return [...new Set(descriptions)];
}
