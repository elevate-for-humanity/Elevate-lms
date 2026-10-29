// @vitest-environment node
import { expect, it } from 'vitest';
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match.js';

async function headersFor(path: string) {
  const { default: config } = await import('../../apps/lms/next.config.mjs');
  const rules = await config.headers();
  return Object.fromEntries(rules
    .filter((rule: { source: string }) => getPathMatch(rule.source)(path))
    .flatMap((rule: { headers: Array<{ key: string; value: string }> }) => rule.headers.map(header => [header.key, header.value])));
}

it('preserves same-origin framing and document protections outside course preview routes', async () => {
  for (const path of ['/', '/login', '/lms/dashboard', '/workbooks/example', '/apprentice/workbook/example', '/lms/courses-other', '/api/admin/course-preview-other']) {
    const headers = await headersFor(path);
    expect(headers['X-Frame-Options'], path).toBe('SAMEORIGIN');
    expect(headers['Content-Security-Policy'], path).toBe("frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  }
  for (const path of ['/workbooks/example', '/apprentice/workbook/example']) {
    const headers = await headersFor(path);
    expect(headers['Cache-Control']).toContain('no-store');
    expect(headers['X-Robots-Tag']).toContain('noarchive');
  }
});

it('allows only the trusted Admin frame for signed course handoffs and their LMS lesson destinations', async () => {
  for (const path of ['/api/admin/course-preview', '/lms/courses', '/lms/courses/course-id', '/lms/courses/course-id/lessons/lesson-id']) {
    const headers = await headersFor(path);
    expect(headers['Content-Security-Policy'], path).toBe("frame-ancestors 'self' https://admin.elevateforhumanity.org; object-src 'none'; base-uri 'self'");
    expect(headers['X-Frame-Options'], path).toBeUndefined();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
  }
});
