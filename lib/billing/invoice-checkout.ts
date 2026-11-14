export type OwnedInvoice = {
  customer_external_key: string | null;
  customer_email: string | null;
};

export function invoiceBelongsToUser(
  invoice: OwnedInvoice,
  userId: string,
  userEmail: string | null | undefined,
): boolean {
  if ([userId, `user:${userId}`].includes(invoice.customer_external_key || '')) return true;
  return Boolean(
    userEmail &&
    invoice.customer_email &&
    invoice.customer_email.trim().toLowerCase() === userEmail.trim().toLowerCase(),
  );
}

export function affirmInvoiceOrderId(invoiceId: string, amountCents: number): string {
  return `billing-invoice--${invoiceId}--${amountCents}`;
}

export function isAffirmInvoiceAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents >= 5_000 && amountCents <= 3_000_000;
}
