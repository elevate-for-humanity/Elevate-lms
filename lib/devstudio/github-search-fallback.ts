/**
 * GitHub code-search fallback classification — pure helper for PR1 (#2070).
 *
 * Code search has an independent GitHub rate limit and private installations
 * may authorise Contents while denying Search. searchCode() used to swallow
 * 403/429 as an empty result, so a receipt could not tell "no matches" from
 * "search was unavailable and the repair fell back to tree/contents reads".
 * This classifier is the single place that distinction is made.
 *
 * Dependency-free on purpose: unit-tested without any credential or network.
 */

export type SearchFallback =
  | 'none'
  | 'SEARCH_RATE_LIMITED_FALLBACK'
  | 'SEARCH_FORBIDDEN_FALLBACK';

/**
 * @param status HTTP status from the code-search endpoint.
 * @param repositoryReadable true when the same credential still reads the
 *   repository (GET /git/ref/heads/main) — a 401 is then optional-discovery
 *   only, not an authorisation failure for the repair.
 */
export function classifySearchFailure(
  status: number,
  repositoryReadable?: boolean,
): SearchFallback {
  if (status === 429) return 'SEARCH_RATE_LIMITED_FALLBACK';
  if (status === 403) return 'SEARCH_FORBIDDEN_FALLBACK';
  if (status === 401 && repositoryReadable === true) return 'SEARCH_FORBIDDEN_FALLBACK';
  return 'none';
}
