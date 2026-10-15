const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

async function exercise({ outside = false, spoofedId = false } = {}) {
  const emails = [],
    writes = [],
    queries = [];
  const user = { id: 'authenticated-student', email: 'student@example.com' };
  const db = {
    from(table) {
      const q = {
        table,
        fields: '',
        operation: null,
        values: null,
        select(fields) {
          this.fields = fields;
          return this;
        },
        eq(key, value) {
          queries.push({ table, key, value });
          return this;
        },
        in() {
          return this;
        },
        insert(values) {
          this.operation = 'insert';
          this.values = values;
          writes.push({ table, values });
          return this;
        },
        update(values) {
          this.operation = 'update';
          this.values = values;
          writes.push({ table, values });
          return this;
        },
        result() {
          if (table === 'profiles')
            return this.fields === 'id'
              ? { data: [{ id: 'administrator' }] }
              : { data: { full_name: 'Student <One>', email: user.email } };
          if (table === 'apprentices')
            return { data: { id: 'apprentice-one', shop_id: 'shop-one' } };
          if (table === 'apprentice_sites')
            return {
              data: {
                id: 'site-one',
                shop_id: 'shop-one',
                name: 'School & Shop',
                latitude: 40,
                longitude: -86,
                radius_meters: 150,
              },
            };
          if (table === 'progress_entries')
            return this.operation === 'update'
              ? { data: { hours_worked: 2 } }
              : {
                  data: {
                    id: 'entry-one',
                    site_id: 'site-one',
                    clock_in_at: new Date(Date.now() - 2 * 3600000).toISOString(),
                    clock_out_at: null,
                    lunch_start_at: null,
                    lunch_end_at: null,
                  },
                };
          return { data: null, error: null };
        },
        maybeSingle() {
          return Promise.resolve(this.result());
        },
        single() {
          return Promise.resolve(this.result());
        },
        then(resolve, reject) {
          return Promise.resolve(this.result()).then(resolve, reject);
        },
      };
      return q;
    },
  };
  const stubs = {
    'next/server': {
      NextResponse: {
        json(body, options) {
          return { body, status: options?.status || 200 };
        },
      },
    },
    '@/lib/logger': { logger: { error() {}, warn() {} } },
    '@/lib/errors/normalize-error': { normalizeError: (x) => x, getErrorContext: () => ({}) },
    '@/lib/supabase/server': {
      createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }),
    },
    '@/lib/supabase/admin': { requireAdminClient: async () => db },
    '@/lib/api/withRateLimit': { applyRateLimit: async () => null },
    '@/lib/audit/withApiAudit': { withApiAudit: (_path, handler) => handler },
    '@/lib/barber/suspension': { checkBarberSuspension: async () => null },
    '@/lib/email/service': {
      sendEmail: async (email) => {
        emails.push(email);
      },
    },
    '@/lib/events/emit': { emitEvent: async () => {} },
    '@/lib/identity/clock-eligibility': {},
    '@/lib/portal/apprenticeship-portal-paths': {
      APPRENTICE_TIMECLOCK_URL: '/apprentice/timeclock',
    },
    '@/lib/timeclock/work-date': {
      getTimeclockWorkDate: () => '2026-10-13',
      getTimeclockWeekEnding: () => '2026-10-18',
    },
    '@/lib/timeclock/policy': { APPRENTICE_TIME_POLICY: {} },
  };
  const source = fs.readFileSync('apps/lms/app/api/timeclock/action/route.ts', 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      assert.ok(stubs[name], name);
      return stubs[name];
    },
    Date,
    Promise,
  });
  const result = await exports.POST({
    json: async () => ({
      action: 'clock_out',
      apprentice_id: spoofedId ? 'different-apprentice' : 'apprentice-one',
      program_id: 'program-one',
      site_id: 'site-one',
      progress_entry_id: 'entry-one',
      lat: outside ? 40.01 : 40,
      lng: -86,
      accuracy_m: 5,
    }),
  });
  return { result, emails, writes, queries };
}

(async () => {
  const blocked = await exercise({ outside: true });
  assert.equal(blocked.result.status, 403);
  assert.equal(
    blocked.writes.filter((w) => w.table === 'progress_entries').length,
    0,
    'Off-site clock-out must not mutate attendance',
  );
  const adminEmail = blocked.emails.filter((e) => e.to === 'elevate4humanityedu@gmail.com');
  assert.equal(adminEmail.length, 1, 'One detailed admin email per blocked attempt');
  assert.match(adminEmail[0].subject, /Student <One>/);
  assert.match(adminEmail[0].html, /Student &lt;One&gt;/);
  assert.match(adminEmail[0].html, /School &amp; Shop/);
  assert.match(blocked.result.body.message, /pending attendance review/);
  const alert = blocked.writes.find((w) => w.table === 'admin_alerts');
  assert.equal(alert.values.metadata.student_name, 'Student <One>');
  assert.equal(alert.values.metadata.apprentice_id, 'apprentice-one');
  assert.ok(
    blocked.queries.some(
      (q) => q.table === 'profiles' && q.key === 'id' && q.value === 'authenticated-student',
    ),
    'Student name must come from authenticated identity',
  );
  console.log('PASS: off-site block, named alert, escaping, one admin email');

  const accepted = await exercise();
  assert.equal(accepted.result.status, 200);
  assert.equal(accepted.result.body.hours_worked, 2);
  assert.equal(accepted.writes.filter((w) => w.table === 'progress_entries').length, 1);
  assert.ok(accepted.emails.some((e) => e.subject === 'Successful clock-out: Student <One>'));
  assert.ok(
    accepted.writes.some(
      (w) => w.table === 'notifications' && w.values[0]?.metadata.action === 'clock_out',
    ),
  );
  console.log('PASS: on-site close retains persisted hours and sends named confirmation');

  const spoofed = await exercise({ spoofedId: true });
  assert.equal(spoofed.result.status, 403);
  assert.equal(spoofed.writes.length, 0);
  assert.equal(spoofed.emails.length, 0);
  console.log('PASS: another apprentice ID cannot trigger a clock-out or alert');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
