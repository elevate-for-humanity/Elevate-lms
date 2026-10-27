type Invoice = { Id?: string; InvoiceLink?: string | null };

/** Intuit requires include=invoiceLink when reading an invoice payment URL. */
export async function resolveQuickBooksInvoiceLink(
  invoice: Invoice,
  read: (path: string) => Promise<{ Invoice?: Invoice }>,
): Promise<string | undefined> {
  if (invoice.InvoiceLink) return invoice.InvoiceLink;
  if (!invoice.Id) throw new Error('QuickBooks invoice ID is missing.');
  const result = await read(`invoice/${encodeURIComponent(invoice.Id)}?include=invoiceLink`);
  return result.Invoice?.InvoiceLink || undefined;
}
