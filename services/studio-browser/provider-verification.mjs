/** Visible challenge signals only. HTTP codes and network failures are not
 * evidence of bot detection and must remain ordinary recoverable errors. */
export function requiresHumanVerification(snapshot) {
  const text = String(snapshot?.visibleText || '');
  return /verify (?:that )?you are (?:a )?human/i.test(text) ||
    (/performing security verification|checking your browser/i.test(text) &&
      /cloudflare|not a bot/i.test(text));
}

/** Evidence is diagnostic text, not an authentication or download URL store. */
export function redactBrowserEvidence(value) {
  return String(value || '')
    .replace(/https?:\/\/[^\s<>"']+/gi, (raw) => {
      try {
        const url = new URL(raw);
        url.username = ''; url.password = ''; url.search = ''; url.hash = '';
        if (url.hostname === 'challenges.cloudflare.com') url.pathname = '/[verification]';
        return url.toString();
      } catch { return '[redacted-url]'; }
    })
    .replace(/\b(?:password|access_token|refresh_token|id_token|session_token|token|secret)\s*[:=]\s*[^\s,;]+/gi,
      (match) => `${match.split(/[:=]/)[0]}=[redacted]`)
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+/gi, 'Bearer [redacted]');
}
