/**
 * Domainee API types — derived from real API responses (verified 2026-08-09).
 * See https://domainee.dev/docs
 */

export interface DomaineeDnsRecord {
  type: string; // "CNAME" | "ALIAS" | "A"
  name: string;
  value: string; // e.g. "edge.domainee.dev"
  purpose: string; // e.g. "Traffic Routing"
}

export interface DomaineeWarning {
  code: string; // e.g. "dns_unresolvable"
  message: string;
}

export interface DomaineeDomain {
  id: string;
  workspaceId: string;
  hostname: string;
  originUrl: string;
  metadata?: Record<string, unknown>;
  mode: string; // "proxy"
  keepHost: boolean;
  redirectWww: boolean;
  redirectStatus: number;
  status: string; // "pending" | "verified" | "active" | "failed"
  dnsRecords: DomaineeDnsRecord[];
  verificationToken?: string;
  isResolving: boolean;
  pointsToEdge: boolean;
  dnsPointedAt: string[];
  monitorStatus: string; // "unknown" | "ok" | ...
  createdAt: string;
  updatedAt: string;
}

export interface DomaineeConnectResponse {
  domain: DomaineeDomain;
  warnings: DomaineeWarning[];
}

export interface DomaineeListResponse {
  domains: DomaineeDomain[];
  nextCursor: string | null;
}

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

export interface DomaineeBuyRequest {
  hostname: string;
  years: number;
  registrant: DomaineeRegistrant;
  customerReference?: string;
  autoConnect?: { originUrl: string };
}

export interface DomaineePurchase {
  id: string;
  hostname: string;
  status: string; // "completed" | "failed" | "pending"
  totalCents: number;
  expiresAt?: string;
  connectedDomainId?: string;
}

export interface DomaineeBuyResponse {
  purchase: DomaineePurchase;
}

export interface DomaineePurchaseListResponse {
  purchases: DomaineePurchase[];
  nextCursor: string | null;
}

export interface DomaineeWebhookEndpoint {
  id: string;
  workspaceId: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

export type DomaineeWebhookEventType =
  | 'domain.created'
  | 'domain.verified'
  | 'domain.failed'
  | 'domain.expired'
  | 'domain.deleted'
  | 'domain.monitor_updated';

export interface DomaineeWebhookEvent {
  id: string;
  type: DomaineeWebhookEventType;
  createdAt: string;
  data: Record<string, unknown> & { id?: string };
}

export interface DomaineeApiError {
  error: string;
  message?: string;
}
