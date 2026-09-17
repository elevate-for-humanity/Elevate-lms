import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const middleware = readFileSync(path.join(process.cwd(), 'apps/admin/middleware.ts'), 'utf8');

describe('Admin middleware cron authentication contract', () => {
  it('admits all cron routes only with the configured bearer credential', () => {
    expect(middleware).toContain("pathname.startsWith('/api/cron/') && hasCronBearer(req)");
    expect(middleware).toContain("req.headers.get('authorization') === `Bearer ${cronSecret}`");
  });

  it('does not expose an individual cron route as a public path', () => {
    const publicPaths = middleware.slice(
      middleware.indexOf('const PUBLIC_PATHS'),
      middleware.indexOf('function isPublicPath'),
    );
    expect(publicPaths).not.toContain('/api/cron/');
  });

  it('admits the signed Telnyx webhook before browser-session authentication', () => {
    const publicPaths = middleware.slice(
      middleware.indexOf('const PUBLIC_PATHS'),
      middleware.indexOf('function isPublicPath'),
    );
    expect(publicPaths).toContain("'/api/webhooks/telnyx'");
  });
});
