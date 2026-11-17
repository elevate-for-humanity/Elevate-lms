import type { TenantSiteConfig } from './site-types';

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
    emailHref: /^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email) && !/[\u0000-\u001f\u007f]/.test(email) ? `mailto:${email}` : null,
    phoneHref: /^\+?[\d ().-]{3,80}$/.test(phone) && /\d{3}/.test(phone.replace(/\D/g, '')) ? `tel:${phone.replace(/[^+\d]/g, '')}` : null,
  };
}
