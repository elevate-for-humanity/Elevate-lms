export type OwnedInvoice = {
  customer_external_key: string | null;
  customer_email: string | null;
};

export function invoiceBelongsToUser(
  invoice: OwnedInvoice,
  userId: string,
  userEmail: string | null | undefined,
): boolean {
  const key = invoice.customer_external_key || '';
  if ([userId, `user:${userId}`].includes(key)) return true;

  // An explicit Elevate account takes precedence over a legacy billing email.
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (key.startsWith('user:') || uuid.test(key)) return false;
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
