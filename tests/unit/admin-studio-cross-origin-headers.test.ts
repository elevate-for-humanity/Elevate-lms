import { describe, expect, it } from 'vitest';
import adminConfig from '../../apps/admin/next.config.mjs';

describe('Admin Studio runtime headers', () => {
  it('cross-origin isolates Studio so SharedArrayBuffer workers can start', async () => {
    const rules = await adminConfig.headers?.();
    const studio = rules?.find((rule) => rule.source === '/studio/:path*');
    expect(studio?.headers).toEqual(
      expect.arrayContaining([
        { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
      ]),
    );
  });
});
