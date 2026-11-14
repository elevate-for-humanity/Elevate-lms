/**
 * Banned tokens for stub/placeholder content detection.
 * Single source of truth for CI gates, runtime validators, and audit scripts.
 */

export const BANNED_TOKENS = [
  'sample',
  'example',
  'lorem',
  'placeholder',
  'demo',
  'test',
  'tbd',
  'fake',
] as const;

export type BannedToken = (typeof BANNED_TOKENS)[number];

/**
 * Case-insensitive regex pattern for matching any banned token.
 * Use for scanning code, DB content, or runtime validation.
 */
export const BANNED_TOKENS_PATTERN = new RegExp(
  BANNED_TOKENS.map((t) => t.replace(/\s+/g, '\\s+')).join('|'),
  'gi',
);

/**
 * Check if text contains any banned tokens.
 * @returns Array of matched tokens, or empty array if clean.
 */
export function findBannedTokens(text: string): string[] {
  if (!text) return [];
  const matches = text.match(BANNED_TOKENS_PATTERN);
  return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
}

/**
 * Check if text is clean (contains no banned tokens).
 */
export function isCleanContent(text: string): boolean {
  return findBannedTokens(text).length === 0;
}
