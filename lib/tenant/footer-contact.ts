import type { TenantSiteConfig, TenantSiteContact } from './site-types';

/** Model output is a candidate; retain only values copied from owner-supplied contact text. */
export function suppliedWebsiteContact(input: unknown, sources: string[]): TenantSiteContact {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const candidate = input as Record<string, unknown>;
  const fold = (value: string) => value.replace(/\s+/g, ' ').trim();
  const rawSources = sources.filter((value): value is string => typeof value === 'string');
  const supplied = rawSources.map(fold);
  const escapeRegExp = (value: string) => value.replace(/[.*+?^$(){}|[\]\\]/g, '\\$&');

  const emails = rawSources
    .flatMap(source => source.match(/[^\s<>()\x5b\x5d,;:"]+@[^\s<>()\x5b\x5d,;:"]+/g) || [])
    .map(value => {
      const token = value.replace(/[.!?]+$/, '');
      const pairedQuotes = [
        ["'", "'"],
        ['“', '”'],
        ['‘', '’'],
      ] as const;
      const pair = pairedQuotes.find(([open, close]) => token.startsWith(open) && token.endsWith(close));
      return pair ? token.slice(1, -1) : token.replace(/['’]$/, '');
    });

  const supportedServiceCodes = new Set(['211', '311', '411', '511', '611', '711', '811', '911', '988']);
  const validPhoneShape = (value: string) => {
    if (!/^\+?\s*[\d(). -]+$/.test(value)) return false;
    const digits = value.replace(/\D/g, '');
    if (!(digits.length === 3 && /^\d{3}$/.test(value) && supportedServiceCodes.has(digits))
      && (digits.length < 7 || digits.length > 15)) return false;
    let depth = 0;
    for (const character of value) {
      if (character === '(') depth += 1;
      if (character === ')') {
        depth -= 1;
        if (depth < 0) return false;
      }
    }
    return depth === 0;
  };

  const phoneTokens = (line: string) =>
    line.match(/(?:\+\s*)?(?:\(\d[\d .-]*\)|\d)(?:[\d .()-]*\d|\(\d[\d .-]*\))?/g) || [];
  const lineHasIndependentPhone = (line: string) =>
    phoneTokens(line).some(token => validPhoneShape(token.trim()));

  const suppliedPhone = (value: unknown, limit: number) => {
    if (typeof value !== 'string' || !value.trim() || value.length > limit) return undefined;
    const cleaned = value.trim();
    if (!validPhoneShape(cleaned)) return undefined;
    const pattern = new RegExp(cleaned.split(/\s+/).map(escapeRegExp).join('\\s+'), 'g');

    for (const source of rawSources) {
      for (const match of source.matchAll(pattern)) {
        const start = match.index ?? 0;
        const end = start + match[0].length;
        const before = source[start - 1] || '';
        const after = source[end] || '';

        if (/[\p{L}\p{N}+()]/u.test(before) || /[\p{L}\p{N}]/u.test(after)) continue;
        if (after === ')') {
          const currentLineStart = source.lastIndexOf('\n', start - 1) + 1;
          const prefixOnLine = source.slice(currentLineStart, start);
          const openParens = (prefixOnLine.match(/\(/g) || []).length;
          const closeParens = (prefixOnLine.match(/\)/g) || []).length;
          if (openParens <= closeParens) continue;
        }
        if (cleaned.replace(/\D/g, '').length === 3) {
          const lineStart = source.lastIndexOf('\n', start - 1) + 1;
          const lineEndIndex = source.indexOf('\n', end);
          const lineEnd = lineEndIndex === -1 ? source.length : lineEndIndex;
          const previousLineEnd = Math.max(0, lineStart - 1);
          const previousLineStart = source.lastIndexOf('\n', previousLineEnd - 1) + 1;
          const currentLine = source.slice(lineStart, lineEnd);
          const previousLine = source.slice(previousLineStart, previousLineEnd);
          const contactKeyword = /\b(call|phone|dial|text|hotline|support|emergency)\b/i;
          const relativeStart = start - lineStart;
          const hasInlineContext = contactKeyword.test(currentLine.slice(0, relativeStart));
          const previousLineLabel = previousLine.trim();
          const candidateAtLineStart = new RegExp(
            '^\\s*' + escapeRegExp(cleaned),
          ).exec(currentLine);
          const candidateSuffix = currentLine.slice(relativeStart + match[0].length);
          const candidateOccupiesLine = new RegExp(
            '^\\s*' + escapeRegExp(cleaned) + '\\s*[.!?]?\\s*$',
          ).test(currentLine);
          const hasBoundedSuffix = /^(?:\s*\([^()\r\n]{1,80}\)|\s*[—–-]\s*[^\r\n]{1,80})\s*[.!?]?\s*$/.test(candidateSuffix)
            && !lineHasIndependentPhone(candidateSuffix);
          const hasBoundedAnnotation = candidateAtLineStart !== null && hasBoundedSuffix;
          const trailingContactDestination = /^(?:\s*\(\s*|\s*[—–-]\s*)(?:hotline|helpline|emergency(?:\s+(?:line|number))?|support\s+(?:line|hotline|number)|phone(?:\s+(?:line|number))?|(?:call|dial|text)\s+(?:us|this|here|the\s+number)|call\s+or\s+text|crisis\s+(?:support\s+)?hotline)(?:\s*,\s*(?:(?:available|open)\s+(?:24\s*\/\s*7|around\s+the\s+clock)|24\s*\/\s*7))?\s*\)?\s*[.!?]?\s*$/i;
          const hasTrailingContactAnnotation = hasBoundedSuffix
            && trailingContactDestination.test(candidateSuffix);
          const hasExplicitPreviousLineLabel = (candidateOccupiesLine || hasBoundedAnnotation)
            && !/\d/.test(previousLineLabel)
            && (
              /^(?:call|phone|dial|text|hotline|support|emergency)\s*:?$/i.test(previousLineLabel)
              || (
                previousLineLabel.length <= 80
                && previousLineLabel.endsWith(':')
                && contactKeyword.test(previousLineLabel)
              )
            );
          if (!hasInlineContext && !hasExplicitPreviousLineLabel && !hasTrailingContactAnnotation) continue;
        }
        if ((before === '.' || before === '-') && /\d/.test(cleaned[0] || '')) continue;
        if ((after === '.' || after === '-') && /\d/.test(source[end + 1] || '')) continue;

        const candidateDigits = cleaned.replace(/\D/g, '');
        const leftGap = source.slice(0, start).match(/\s+$/)?.[0] || '';
        const previous = source[start - leftGap.length - 1] || '';
        if (leftGap && /[+()\d]/.test(previous)) {
          const priorLine = source.slice(0, start - leftGap.length).split(/\r?\n/).pop()?.trim() || '';
          const priorTokens = phoneTokens(priorLine);
          const priorDigits = (priorTokens[priorTokens.length - 1] || '').replace(/\D/g, '');
          const couldBeOnePhone = candidateDigits.length + priorDigits.length <= 15;
          if (!leftGap.includes('\n') || couldBeOnePhone || !lineHasIndependentPhone(priorLine)) continue;
        }

        const rightGap = source.slice(end).match(/^\s+/)?.[0] || '';
        const next = source[end + rightGap.length] || '';
        if (rightGap && /[+\d]/.test(next)) {
          const nextLine = source.slice(end + rightGap.length).split(/\r?\n/)[0]?.trim() || '';
          const nextDigits = (phoneTokens(nextLine)[0] || '').replace(/\D/g, '');
          const couldBeOnePhone = candidateDigits.length + nextDigits.length <= 15;
          const numericSchedule = !rightGap.includes('\n') && /^\d{1,2}\s*(?:am|pm)\b/i.test(nextLine);
          if (!numericSchedule
            && (!rightGap.includes('\n') || couldBeOnePhone || !lineHasIndependentPhone(nextLine))) continue;
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
    const matches = kind === 'email'
      ? emails.includes(cleaned)
      : supplied.some(source => source.includes(fold(cleaned)));
    return matches ? cleaned : undefined;
  };

  const result: TenantSiteContact = {};
  for (const [key, limit] of [['email', 180], ['phone', 80], ['address', 300]] as const) {
    const value = copy(candidate[key], limit, key);
    if (value) result[key] = value;
  }
  if (Array.isArray(candidate.hours)) {
    const hours = candidate.hours
      .slice(0, 14)
      .map(value => copy(value, 120))
      .filter((value): value is string => value !== undefined);
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
