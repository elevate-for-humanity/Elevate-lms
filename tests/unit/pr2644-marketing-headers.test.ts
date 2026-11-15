import { expect, it } from 'vitest';
import config from '../../apps/marketing/next.config.mjs';
it('permits Admin Studio framing while excluding arbitrary origins', async () => {
  const rule = (await config.headers()).find(rule => rule.source === '/(.*)');
  const headers = Object.fromEntries(rule!.headers.map(header => [header.key, header.value]));
  expect(headers['Content-Security-Policy']).toBe("frame-ancestors 'self' https://admin.elevateforhumanity.org");
  expect(headers['X-Frame-Options']).toBeUndefined();
  expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
});
