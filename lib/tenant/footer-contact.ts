import type { TenantSiteConfig, TenantSiteContact } from './site-types';

/** Model output is a candidate; retain only values copied from owner-supplied contact text. */
export function suppliedWebsiteContact(input: unknown, sources: string[]): TenantSiteContact {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const candidate = input as Record<string, unknown>;
  const fold = (value: string) => value.replace(/\s+/g, ' ').trim();
  const rawSources = sources.filter(value => typeof value === 'string');
  const supplied = rawSources.map(fold);
  // Strip prose suffixes and paired quotes, retaining unsupported address prefixes.
  const emails = rawSources.flatMap(source => source.match(/[^\s<>()\x5b\x5d,;:"]+@[^\s<>()\x5b\x5d,;:"]+/g) || []).map(value => {
    const token = value.replace(/[.!?]+$/, '');
    return token.startsWith("'") && token.endsWith("'") ? token.slice(1, -1) : token.replace(/'$/, '');
  });
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const suppliedPhone = (value: unknown, limit: number) => {
    if (typeof value !== 'string' || !value.trim() || value.length > limit) return undefined;
    const cleaned = value.trim();
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15 || !/^\+?\s*[\d(). -]+$/.test(fold(cleaned))) return undefined;
    let depth = 0;
    for (const character of cleaned) {
      if (character === '(') depth += 1;
      if (character === ')' && --depth < 0) return undefined;
    }
    if (depth !== 0) return undefined;
    // Match the complete generated candidate against owner text. Flexible whitespace
    // keeps a number split across a line, but newlines still separate two numbers.
    const pattern = new RegExp(cleaned.split(/\s+/).map(escapeRegExp).join('\\s+'), 'g');
    for (const source of rawSources) {
      for (const match of source.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const before = source[start - 1] || '';
        const after = source[end] || '';
        if (/[\p{L}\p{N}+.(\-]/u.test(before) || /[\p{L}\p{N})]/u.test(after)) continue;
        if ((after === '.' || after === '-') && /\d/.test(source[end + 1] || '')) continue;
        const left = source.slice(0, start);
        const leftGap = left.match(/\s+$/)?.[0] ?? '';
        const previousText = left.slice(0, left.length - leftGap.length);
        if (leftGap && /[+().\d-]$/.test(previousText)) {
          const preceding = previousText.match(/[+\d(). \t-]+$/)?.[0] ?? '';
          // A line separates complete numbers only when combining them would exceed the phone limit.
          // Ambiguous short prefixes remain attached instead of authorizing a different recipient.
          const previousDigits = preceding.replace(/\D/g, '').length;
          if (!/[\r\n]/.test(leftGap) || previousDigits < 7 || previousDigits + digits.length <= 15) continue;
        }
        const right = source.slice(end);
        const rightGap = right.match(/^\s+/)?.[0] ?? '';
        const followingText = right.slice(rightGap.length);
        const availability = /^\(\d{1,2}\s*[-–]\s*\d{1,2}\)/.test(followingText);
        if (rightGap && /^[\d+(]/.test(followingText) && !availability) {
          const following = followingText.match(/^[+\d(). \t-]+/)?.[0] ?? '';
          const followingDigits = following.replace(/\D/g, '').length;
          if (!/[\r\n]/.test(rightGap) || followingDigits < 7 || followingDigits + digits.length <= 15) continue;
        }
        return cleaned;
      }
    }
    return undefined;
  };
  const copy = (value: unknown, limit: number, kind?: 'email' | 'phone' | 'address') => {
    if (kind === 'phone') return suppliedPhone(value, limit);
    if (typeof value !== 'string' || !value.trim() || value.length > limit) return undefined;
    const cleaned = value.trim();
    const matches = kind === 'email' ? emails.includes(cleaned) : supplied.some(source => source.includes(fold(cleaned)));
    return matches ? cleaned : undefined;
  };
  const result: TenantSiteContact = {};
  for (const [key, limit] of [['email', 180], ['phone', 80], ['address', 300]] as const) {
    const value = copy(candidate[key], limit, key);
    if (value) result[key] = value;
  }
  if (Array.isArray(candidate.hours)) {
    const hours = candidate.hours.slice(0, 14).map(value => copy(value, 120)).filter((value): value is string => value !== undefined);
    if (hours.length) result.hours = hours;
  }
  return result;
}

/** Inspect the opt-in before any import/generation normalization. */
export function validateFooterContactFields(input: unknown) {
  const footer = input && typeof input === 'object' ? (input as Record<string, unknown>).footer : undefined;
  const value = footer && typeof footer === 'object' ? (footer as Record<string, unknown>).showContactDetails : undefined;
  return value !== undefined && typeof value !== 'boolean'
    ? [{ severity: 'error' as const, code: 'invalid_footer_contact', message: 'Footer contact visibility must be true or false.' }]
    : [];
}

export function footerContactDetails(config: TenantSiteConfig) {
  if (config.footer.showContactDetails !== true) return null;
  const text = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
  const email = text(config.contact?.email, 180);
  const phone = text(config.contact?.phone, 80);
  const address = text(config.contact?.address, 300);
  const hours = Array.isArray(config.contact?.hours) ? config.contact.hours.slice(0, 14).map(value => text(value, 120)).filter(Boolean) : [];
  if (!email && !phone && !address && !hours.length) return null;
  return {
    email, phone, address, hours,
    emailHref: /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email) && ![...email].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ? `mailto:${email}` : null,
    phoneHref: /^\+?[\d ().-]{3,80}$/.test(phone) && /\d{3}/.test(phone.replace(/\D/g, '')) ? `tel:${phone.replace(/[^+\d]/g, '')}` : null,
  };
}
