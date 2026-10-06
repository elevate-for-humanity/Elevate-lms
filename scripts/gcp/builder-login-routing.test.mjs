import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

function read(path) {
  const base = process.env.LOGIN_SOURCE_ROOT || '.';
  return readFileSync(base + '/' + path, 'utf8');
}
function compile(source) {
  return stripTypeScriptTypes(source.replace(/import[\s\S]*?from ['"][^'"]+['"];\n/g, '').replace(/^export /gm, ''));
}
const context = {
  URL,
  siteUrls: { site: 'https://www.elevateforhumanity.org', app: 'https://app.elevateforhumanity.org', admin: 'https://admin.elevateforhumanity.org' },
  ROLE_ROUTE_CONFIG: { student: { path: '/lms/dashboard' }, admin: { path: '/dashboard' } },
  getRoleDestinationUrl: role => role === 'admin' ? 'https://admin.elevateforhumanity.org/dashboard' : 'https://app.elevateforhumanity.org/lms/dashboard',
  resolveRoleRoute: role => ({ path: role === 'admin' ? '/dashboard' : '/lms/dashboard' }),
};
const api = runInNewContext(compile(read('lib/auth/absolute-role-destination.ts')) + '\n' +
  compile(read('lib/auth/post-login-redirect.ts')) + '\n({resolveRoleCompatiblePostLoginUrl,isSharedPostLoginDestination})', context);

test('Website Builder returns to Marketing for buyer roles and nested editor routes', () => {
  for (const role of ['student', 'admin']) {
    for (const path of ['/apps/website-builder', '/apps/website-builder/edit/site/preview']) {
      assert.equal(api.resolveRoleCompatiblePostLoginUrl(path, role), context.siteUrls.site + path);
    }
  }
});
test('shared-tool return does not grant arbitrary host or private-portal access', () => {
  assert.equal(api.isSharedPostLoginDestination('https://evil.example/apps/website-builder'), false);
  assert.equal(api.isSharedPostLoginDestination('https://www.elevateforhumanity.org/apps/website-builder-admin'), false);
  assert.equal(api.resolveRoleCompatiblePostLoginUrl('/dashboard', 'student'), context.siteUrls.app + '/lms/dashboard');
  assert.equal(api.isSharedPostLoginDestination('https://store.elevateforhumanity.org/store/plans'), true);
});
test('login preserves the shared tool destination before learner role defaults', () => {
  const source = read('apps/lms/app/login/page.tsx');
  assert.ok(source.includes('isSharedPostLoginDestination(requestedDestination)'));
  assert.ok(source.indexOf('if (isSharedReturn)') < source.indexOf("else if (profile.role === 'employer'"));
});
