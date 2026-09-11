export const BILLING_PROVIDERS = ['quickbooks', 'stripe'] as const;
export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
export type BillingProviderMode = 'primary' | 'archive';

export interface BillingCustomerInput {
  externalKey: string;
  displayName: string;
  email: string;
}

export interface BillingLineInput {
  canonicalKey: string;
  name: string;
  description?: string;
  quantity: number;
  unitAmountCents: number;
}

export interface ManualInvoiceInput {
  idempotencyKey: string;
  customer: BillingCustomerInput;
  lines: BillingLineInput[];
  dueDate: string;
  memo?: string;
  fulfillment?: {
    type: string;
    payload: Record<string, unknown>;
  };
}

export interface BillingInvoiceResult {
  provider: BillingProvider;
  providerInvoiceId: string;
  invoiceNumber?: string;
  paymentUrl?: string;
  totalCents: number;
}

export interface BillingProviderAdapter {
  readonly provider: BillingProvider;
  createManualInvoice(input: ManualInvoiceInput): Promise<BillingInvoiceResult>;
}
