export const COMMUNICATION_EMAIL_DOMAIN = 'elevateforhumanity.org';

export const STAFF_MAILBOX_ROLES = [
  'super_admin',
  'admin',
  'org_admin',
  'staff',
  'instructor',
  'case_manager',
  'counselor',
  'advisor',
  'employee',
  'support',
] as const;

export type CommunicationMailboxKind = 'individual' | 'program_holder' | 'host_shop' | 'department';

export interface CommunicationMailboxSummary {
  id: string;
  address?: string;
  displayName?: string;
  mailboxKind: CommunicationMailboxKind;
  accessLevel?: 'owner' | 'manager' | 'member';
}

const INACTIVE_PROFILE_STATUSES = new Set(['inactive', 'archived', 'suspended', 'deleted']);
const EMAIL_PATTERN =
  /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const NON_PRODUCTION_LOCAL_PART = /(^|[._+-])(test|demo|sample|example|invalid|qa)[0-9._+-]*$/i;
const NON_PRODUCTION_NAME = /(^|\s)(test|demo|sample|example|invalid|qa)(\s|$)/i;

export function normalizeRoleName(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

export function isStaffMailboxRole(value: unknown): boolean {
  return (STAFF_MAILBOX_ROLES as readonly string[]).includes(normalizeRoleName(value));
}

export function isNonProductionIdentity(email?: string | null, fullName?: string | null): boolean {
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const [localPart = '', domain = ''] = normalizedEmail.split('@');
  return (
    NON_PRODUCTION_LOCAL_PART.test(localPart) ||
    /^(?:qa\.)?invalid$/.test(domain) ||
    /^example\.(?:com|org|net)$/.test(domain) ||
    NON_PRODUCTION_NAME.test(String(fullName || '').trim())
  );
}

export function isActiveEmailProfile(profile: {
  email?: string | null;
  fullName?: string | null;
  isActive?: boolean | null;
  status?: string | null;
}): boolean {
  if (profile.isActive === false) return false;
  if (
    INACTIVE_PROFILE_STATUSES.has(
      String(profile.status || '')
        .trim()
        .toLowerCase(),
    )
  )
    return false;
  return !isNonProductionIdentity(profile.email, profile.fullName);
}

export function parseEmailList(value: unknown): string[] {
  const matches =
    String(value || '').match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return Array.from(
    new Set(
      matches
        .map((address) => address.toLowerCase())
        .filter((address) => EMAIL_PATTERN.test(address)),
    ),
  ).slice(0, 50);
}

export function normalizeEmailSubject(value: unknown): string {
  const subject = String(value || '(no subject)')
    .replace(/[\r\n]+/g, ' ')
    .trim();
  return (subject.replace(/^\s*((re|fw|fwd)\s*:\s*)+/i, '').trim() || '(no subject)')
    .toLowerCase()
    .slice(0, 240);
}

export function cleanEmailSubject(value: unknown): string {
  return (
    String(value || '(no subject)')
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, 240) || '(no subject)'
  );
}

export function safeMailboxDisplayName(value: unknown): string {
  return (
    String(value || 'Elevate Mailbox')
      .replace(/[<>\r\n"]/g, '')
      .trim()
      .slice(0, 120) || 'Elevate Mailbox'
  );
}

export function textToEmailHtml(value: unknown): string {
  const escaped = String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  return `<div style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.6">${escaped}</div>`;
}

export function selectPrimaryMailbox<T extends CommunicationMailboxSummary>(
  mailboxes: T[],
): T | null {
  const priority: Record<CommunicationMailboxKind, number> = {
    program_holder: 0,
    host_shop: 0,
    individual: 1,
    department: 2,
  };
  return (
    [...mailboxes].sort((a, b) => priority[a.mailboxKind] - priority[b.mailboxKind])[0] ?? null
  );
}
