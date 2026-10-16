const ts = require('typescript'),
  fs = require('fs'),
  vm = require('vm'),
  assert = require('assert/strict');
const source = fs.readFileSync(
  require('node:path').join(__dirname, '../apps/lms/app/api/attendance/online/route.ts'),
  'utf8',
);
let user = { id: 'server-user' },
  called;
const response = { json: (data, options = {}) => ({ data, status: options.status || 200 }) };
const context = {
  URL,
  process: { env: { NODE_ENV: 'production' } },
  exports: {},
  require: (name) =>
    name.endsWith('/portal-map')
      ? { LMS_HOST: 'https://app.elevateforhumanity.org' }
      : name === 'next/server'
        ? { NextResponse: response }
        : name.endsWith('/server')
          ? { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) }
          : {
              requireAdminClient: async () => ({
                rpc: async (name, args) => {
                  called = args;
                  return { data: { id: 'session' }, error: null };
                },
              }),
            },
};
vm.runInNewContext(
  ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }),
  context,
);
const request = (origin, body) => ({
  headers: { get: () => origin },
  nextUrl: { origin: 'http://localhost:8080' },
  json: async () => body,
});
(async () => {
  assert.equal((await context.exports.POST(request('https://other.example', {}))).status, 403);
  user = null;
  assert.equal(
    (await context.exports.POST(request('https://app.elevateforhumanity.org', {}))).status,
    401,
  );
  user = { id: 'server-user' };
  assert.equal(
    (await context.exports.POST(request('https://app.elevateforhumanity.org', null))).status,
    400,
  );
  assert.equal(
    (
      await context.exports.POST(
        request('https://app.elevateforhumanity.org', {
          action: 'clock_in',
          enrollment_id: '33333333-3333-4333-8333-333333333333',
          user_id: 'victim',
        }),
      )
    ).status,
    200,
  );
  assert.equal(called.p_user_id, 'server-user');
  console.log(
    'PASS: cross-origin rejection, authentication, null-body validation, client identity ignored',
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
