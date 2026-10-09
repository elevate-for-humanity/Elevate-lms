const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function compile(path, imports = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => imports[name] || require(name), process, Headers, URL, console });
  return exports;
}
const routing = compile('lib/tenant/middleware-tenant-routing.ts');
const { middleware } = compile('apps/marketing/middleware.ts', {
  '@/lib/tenant/middleware-tenant-routing': routing,
  '@/lib/routing/portal-map': { LMS_HOST: 'https://app.elevateforhumanity.org', MARKETING_HOST: 'https://www.elevateforhumanity.org' },
  '@/lib/supabase/middleware': { createMiddlewareSupabaseClient: () => { throw new Error('Probe must not use authentication'); } },
});
for (const host of ['169.254.1.1:3000', '10.0.0.2:3000', 'customer.example', 'acme.app.elevateforhumanity.org', 'elevateforhumanity.org']) {
  for (const path of ['/api/ping', '/api/ready', '/api/health']) {
    test(`${host}${path} bypasses tenant and canonical routing`, async () => {
      const response = await middleware(new NextRequest('http://' + host + path, { headers: { host } }));
      assert.equal(response.headers.get('x-middleware-next'), '1');
      assert.equal(response.headers.get('x-middleware-rewrite'), null);
      assert.equal(response.headers.get('location'), null);
    });
  }
}
for (const path of ['/api/ping-extra', '/api/health/private', '/products']) {
  test(`${path} retains customer tenant routing`, async () => {
    const response = await middleware(new NextRequest('https://customer.example' + path, { headers: { host: 'customer.example' } }));
    assert.equal(new URL(response.headers.get('x-middleware-rewrite')).pathname, '/tenant-site' + path);
  });
}
