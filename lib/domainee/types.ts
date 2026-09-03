/** Domainee API response/request types used by the Website Builder integration. */
export interface DomaineeDnsRecord {
  type: string;
  name: string;
  value: string;
  purpose: string;
}

export interface DomaineeWarning { code: string; message: string }

export interface DomaineeDomain {
  id: string;
  workspaceId: string;
  hostname: string;
  originUrl: string;
  metadata?: Record<string, unknown>;
  mode: string;
  keepHost: boolean;
  redirectWww: boolean;
  redirectStatus: number;
  status: string;
  dnsRecords: DomaineeDnsRecord[];
  verificationToken?: string;
  isResolving: boolean;
  pointsToEdge: boolean;
  dnsPointedAt: string[];
  monitorStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface DomaineeConnectResponse { domain: DomaineeDomain; warnings: DomaineeWarning[] }
export interface DomaineeListResponse { domains: DomaineeDomain[]; nextCursor: string | null }

export interface DomaineeRegistrant {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DomaineePurchasePricing {
  wholesaleCents: number;
  feeCents: number;
  totalCents: number;
  currency: string;
}

export interface DomaineePurchaseQuote {
  hostname: string;
  available: boolean;
  premium: boolean;
  pricing: DomaineePurchasePricing;
}

export interface DomaineePurchase {
  id: string;
  hostname: string;
  status: string;
  totalCents: number;
  expiresAt?: string;
  connectedDomainId?: string;
}

export interface DomaineeBuyResponse { purchase: DomaineePurchase }
export interface DomaineePurchaseListResponse { purchases: DomaineePurchase[]; nextCursor: string | null }

export type DomaineeWebhookEventType =
  | 'domain.created'
  | 'domain.verified'
  | 'domain.failed'
  | 'domain.expired'
  | 'domain.deleted'
  | 'domain.monitor_updated'
  | 'domain_purchase.completed'
  | 'domain_purchase.failed';

export interface DomaineeWebhookEvent {
  id: string;
  type: DomaineeWebhookEventType;
  createdAt: string;
  data: Record<string, unknown> & { id?: string };
}
