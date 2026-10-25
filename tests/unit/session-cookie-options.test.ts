import { describe, expect, it } from 'vitest';
import { sessionCookieOptions } from '../../lib/auth/session-cookie-options';

describe('session cookie scope', () => {
  it.each(['elevateforhumanity.org', 'admin.elevateforhumanity.org', 'app.elevateforhumanity.org', 'ADMIN.ELEVATEFORHUMANITY.ORG:443'])('shares owned portal sessions on %s', host => {
    expect(sessionCookieOptions({ secure: true }, host)).toEqual({ secure: true, domain: '.elevateforhumanity.org' });
  });
  it.each(['paris-acceptance---test.a.run.app', 'localhost:3000', '127.0.0.1:3000', 'elevateforhumanity.org.evil.com', 'evilelevateforhumanity.org', '', 'https://admin.elevateforhumanity.org', 'admin..elevateforhumanity.org'])('keeps %s host-only while preserving session flags', host => {
    const original = { domain: '.elevateforhumanity.org', path: '/', secure: true, sameSite: 'lax', httpOnly: true, maxAge: 3600 };
    const result = sessionCookieOptions(original, host);
    const { domain, ...expected } = original;
    expect(result).toEqual(expected);
    expect(original.domain).toBe(domain);
  });
});
