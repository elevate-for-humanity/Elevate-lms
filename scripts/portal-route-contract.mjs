// App Router serves GET route handlers as navigable URLs as well as pages.
// POST-only handlers must not satisfy a page/download link contract.
export function hasGetRouteHandler(source) {
  return /export\s+(?:async\s+)?function\s+GET\s*\(/.test(source) ||
    /export\s+(?:const|let|var)\s+GET\s*=/.test(source) ||
    /export\s*\{[^}]*\b(?:GET|as\s+GET)\b[^}]*\}/.test(source);
}
