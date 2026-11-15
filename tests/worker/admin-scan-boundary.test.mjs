import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import config from '../../apps/admin/next.config.mjs';

test('Admin headers prevent unrelated framing without blocking portal embeds or scripts', async () => {
  const rules = await config.headers();
  const headers = Object.fromEntries(rules.find(r => r.source === '/:path*').headers.map(h => [h.key, h.value]));
  assert.equal(headers['Strict-Transport-Security'], 'max-age=31536000');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'self' https:\/\/\*\.elevateforhumanity\.org/);
  assert.doesNotMatch(headers['Content-Security-Policy'], /script-src|default-src/);
  assert.equal(rules.find(r => r.source === '/studio/courses/:path*').headers.find(h => h.key === 'Cross-Origin-Embedder-Policy').value, 'unsafe-none');
});

test('exact discovery routes do not bypass authentication on other paths', async () => {
  const source = readFileSync(new URL('../../apps/admin/middleware.ts', import.meta.url), 'utf8');
  const start = source.indexOf('export async function middleware');
  const end = source.indexOf('  const legacyStudioPrefixes', start);
  const snippet = stripTypeScriptTypes(source.slice(start, end) + 'return null;\n}').replace('export ', '');
  class Response extends globalThis.Response {
    static redirect(url, status) { return new Response(null, {status, headers:{Location:String(url)}}); }
  }
  const run = new Function('NextResponse', snippet + '\nreturn middleware;')(Response);
  const request = pathname => ({nextUrl:{pathname,search:''}});
  assert.equal(await (await run(request('/robots.txt'))).text(), 'User-agent: *\nDisallow: /\n');
  assert.equal((await run(request('/sitemap.xml'))).status, 404);
  assert.equal((await run(request('/.well-known/security.txt'))).headers.get('Location'), 'https://www.elevateforhumanity.org/.well-known/security.txt');
  for (const path of ['/dashboard','/api/admin/students','/.well-known/security.txt/extra','/sitemap.xml/extra']) assert.equal(await run(request(path)), null);
});

test('login and reset labels point to distinct real fields', () => {
  const form = readFileSync(new URL('../../apps/admin/app/login/LoginForm.tsx', import.meta.url), 'utf8');
  const labels = [...form.matchAll(/htmlFor="([^"]+)"/g)].map(m => m[1]);
  const inputs = [...form.matchAll(/<input\s+id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(labels.length, 3);
  assert.equal(new Set(labels).size, 3);
  assert.deepEqual(labels, inputs);
  assert.match(form, /Privacy policy/);
  assert.match(form, /Contact support/);
});
