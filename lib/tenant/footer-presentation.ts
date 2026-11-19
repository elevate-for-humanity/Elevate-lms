import type { TenantSiteConfig, TenantSiteSocialLink } from './site-types';

export const MAX_FOOTER_SOCIAL_LINKS = 6;
export const FOOTER_SOCIAL_ICONS = [
  'facebook',
  'linkedin',
  'youtube',
  'instagram',
  'link',
] as const;
const validIcon = (icon: unknown) =>
  icon === undefined ||
  (typeof icon === 'string' && FOOTER_SOCIAL_ICONS.some((value) => value === icon));
const hasControl = (value: string) =>
  [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

/** Presentation URLs are rendered, never fetched by the server. */
export function safeFooterSocialUrl(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^https:\/\/[^/]/i.test(value) ||
    value.length > 2048 ||
    /[\s\\]/.test(value) ||
    hasControl(value)
  )
    return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function safeFooterLogo(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    !value ||
    value.length > 2048 ||
    /[\s\\]/.test(value) ||
    hasControl(value)
  )
    return null;
  return (value.startsWith('/') && !value.startsWith('//')) || safeFooterSocialUrl(value)
    ? value
    : null;
}

/** Validate raw input before normalization can discard a malformed setting. */
export function validateFooterPresentationFields(input: unknown) {
  const issues: Array<{ severity: 'error'; code: string; message: string }> = [];
  const footer =
    input && typeof input === 'object' ? (input as Record<string, unknown>).footer : undefined;
  if (footer === undefined) return issues;
  if (!footer || typeof footer !== 'object' || Array.isArray(footer))
    return [
      {
        severity: 'error' as const,
        code: 'invalid_footer_presentation',
        message: 'Footer settings must be an object.',
      },
    ];
  const raw = footer as Record<string, unknown>;
  const error = (message: string) =>
    issues.push({ severity: 'error', code: 'invalid_footer_presentation', message });
  if (raw.showLogo !== undefined && typeof raw.showLogo !== 'boolean')
    error('Footer logo visibility must be true or false.');
  if (raw.layout !== undefined && raw.layout !== 'stacked' && raw.layout !== 'columns')
    error('Footer layout must be stacked or columns.');
  if (raw.socialLinks !== undefined) {
    if (!Array.isArray(raw.socialLinks) || raw.socialLinks.length > MAX_FOOTER_SOCIAL_LINKS)
      error('Use at most six footer social links.');
    else
      for (const item of raw.socialLinks) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          error('Each social link needs a label and HTTPS URL.');
          continue;
        }
        const { label, url, icon } = item as Record<string, unknown>;
        if (
          typeof label !== 'string' ||
          !label.trim() ||
          label.length > 80 ||
          hasControl(label) ||
          !safeFooterSocialUrl(url) ||
          !validIcon(icon)
        )
          error(
            'Each social link needs a label of 1–80 characters, an HTTPS URL without credentials, and a supported optional icon.',
          );
      }
  }
  return issues;
}

/** Fail closed for older stored configs that have not passed the new validator. */
export function footerSocialLinks(config: TenantSiteConfig): TenantSiteSocialLink[] {
  const links = config.footer.socialLinks;
  if (!Array.isArray(links)) return [];
  return links
    .slice(0, MAX_FOOTER_SOCIAL_LINKS)
    .filter(
      (link) =>
        link &&
        typeof link.label === 'string' &&
        link.label.trim() &&
        link.label.length <= 80 &&
        !hasControl(link.label) &&
        safeFooterSocialUrl(link.url) &&
        validIcon(link.icon),
    );
}

function suppliedPresentationUrls(supplied: string[]) {
  return new Set(
    supplied.flatMap((text) =>
      [...text.matchAll(/(?:^|[\s(<>"'`])((?:https:\/\/|\/)[^\s<>"'`]+)/g)].flatMap((match) => [
        match[1],
        match[1].replace(/[.,;!?)\]}]+$/g, ''),
      ]),
    ),
  );
}

/** Only retain exact supplied URLs, never a model-invented profile or prefix. */
export function suppliedFooterSocialLinks(
  links: TenantSiteSocialLink[] | undefined,
  supplied: string[],
): TenantSiteSocialLink[] {
  const urls = suppliedPresentationUrls(supplied);
  return (links || []).filter((link) => urls.has(link.url));
}

/** A generated footer can reuse a logo only when its source was supplied. */
export function suppliedFooterLogo(value: unknown, supplied: string[]): string | undefined {
  const logo = safeFooterLogo(value);
  return logo && suppliedPresentationUrls(supplied).has(logo) ? logo : undefined;
}
