import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { hasGetRouteHandler } from './portal-route-contract.mjs';
import { hasProgramHolderWorkspaceGuard } from './portal-guard-contract.mjs';
import { hasCleaningProviderMutationGuard } from './cleaning-provider-route-contract.mjs';

const source = readFileSync(new URL('./audit-portal-functions.mjs', import.meta.url), 'utf8');
const routePattern = source.slice(source.indexOf('function pattern('), source.indexOf('const routeIndex'));
const resolvers = source.slice(source.indexOf('function normalizeDynamicTarget('), source.indexOf('function hasBalancedInterpolation('));
const files = { get: 'export async function GET() {}', post: 'export async function POST() {}', constant: 'export const GET = handler;' };
const exists = vm.runInNewContext(routePattern + resolvers + '\nexistsPortalAction', {
  routeIndex: { lms: [{ route: '/workforce/dashboard' }, ...[
    { route: '/workforce/wioa-export/download', file: 'get' },
    { route: '/workforce/post-only', file: 'post' },
    { route: '/workforce/constant', file: 'constant' },
  ].filter(entry => hasGetRouteHandler(files[entry.file]))] },
  apiIndex: { lms: [
    { route: '/workforce/wioa-export/download', file: 'get' },
    { route: '/workforce/post-only', file: 'post' },
    { route: '/workforce/constant', file: 'constant' },
  ] },
  readFileSync: name => files[name],
});

test('portal actions accept pages and GET downloads, preserving missing-route and method checks', () => {
  assert.equal(exists('lms', '/workforce/dashboard'), true);
  assert.equal(exists('lms', '/workforce/wioa-export/download?format=csv'), true);
  assert.equal(exists('lms', '/workforce/constant'), true);
  assert.equal(exists('lms', '/workforce/post-only'), false);
  assert.equal(exists('lms', '/workforce/missing'), false);
});

function checkGuard(guard) {
  const root = mkdtempSync(join(tmpdir(), 'preauth-guard-'));
  const write = (path, value) => {
    const target = join(root, path);
    mkdirSync(join(target, '..'), { recursive: true });
    writeFileSync(target, value);
  };
  try {
    write('scripts/check.cjs', readFileSync(new URL('./check-pre-auth-registry.cjs', import.meta.url)));
    write('lib/pre-auth-tables.ts', "export const tables = [{ table: 'a_different_registered_table' }];");
    write('apps/lms/app/api/attendance/route.ts', guard + "\nawait db.from('host_shop_attendance_records').insert({ student_id: user.id });");
    return spawnSync(process.execPath, ['scripts/check.cjs'], { cwd: root, encoding: 'utf8' });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('the canonical Host Shop guard is recognized without registering attendance as anonymous', () => {
  const result = checkGuard('await requireCurrentHostShopPartner();');
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('unguarded identity writes and an unused guard import still fail', () => {
  for (const guard of ['', "import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';"]) {
    const result = checkGuard(guard);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /host_shop_attendance_records/);
  }
});


test('exam access must use the canonical guard and handle a denial before writing', () => {
  const imported = "import { requireExamSessionAccess } from '@/lib/testing/session-access';";
  const invoked = 'const access = await requireExamSessionAccess(sessionId);';
  const deny = 'if (access instanceof NextResponse) return access;';
  const guarded = checkGuard([imported, invoked, deny].join('\n'));
  assert.equal(guarded.status, 0, guarded.stdout + guarded.stderr);
  for (const unsafe of [
    imported,
    [imported, invoked].join('\n'),
    [imported.replace('@/lib/testing/session-access', './other'), invoked, deny].join('\n'),
    [imported, "await db.from('exam_events').insert({ user_id: user.id });", invoked, deny].join('\n'),
  ]) {
    const result = checkGuard(unsafe);
    assert.equal(result.status, 1, result.stdout + result.stderr);
  }
});

const pagePath = 'apps/lms/app/program-holder/dashboard/page.tsx';
const workspacePath = 'lib/program-holder/workspace.ts';
const repoRoot = new URL('../', import.meta.url).pathname;
const holderPage = readFileSync(join(repoRoot, pagePath), 'utf8');
const holderWorkspace = readFileSync(join(repoRoot, workspacePath), 'utf8');
const pageCall = 'const workspace = await getProgramHolderWorkspace();';
const guardCall = 'const ctx = await requireProgramHolder();';
const guardAudit = source.slice(source.indexOf('const requiredHelpers ='), source.indexOf('\nif (failures)'));

function auditHolder(overrides = {}) {
  const failures = [];
  vm.runInNewContext(guardAudit, {
    ROOT: repoRoot, join, hasProgramHolderWorkspaceGuard,
    readFileSync: (path, encoding) => overrides[path] ?? readFileSync(path, encoding),
    fail: message => failures.push(message), pass() {},
  });
  return failures;
}

test('the actual portal audit proves the dashboard loader authorizes before all workspace reads', () => {
  assert.equal(hasProgramHolderWorkspaceGuard(holderPage, holderWorkspace), true);
  assert.deepEqual(auditHolder(), []);
});

test('the proof follows genuine named-import aliases, not a helper-name substring', () => {
  const page = holderPage
    .replace('{ getProgramHolderWorkspace }', '{ getProgramHolderWorkspace as loadWorkspace }')
    .replace('await getProgramHolderWorkspace()', 'await loadWorkspace()');
  const workspace = holderWorkspace
    .replace('{ requireProgramHolder }', '{ requireProgramHolder as authorizeHolder }')
    .replace('await requireProgramHolder()', 'await authorizeHolder()');
  assert.equal(hasProgramHolderWorkspaceGuard(page, workspace), true);
});

for (const [label, path, altered] of [
  ['an unused loader import', pagePath, holderPage.replace(pageCall, 'const workspace = {};')],
  ['a comment-only loader call', pagePath, holderPage.replace(pageCall, '// ' + pageCall + '\n const workspace = {};')],
  ['an unawaited loader', pagePath, holderPage.replace(pageCall, 'const workspace = getProgramHolderWorkspace();')],
  ['a conditional loader', pagePath, holderPage.replace(pageCall, 'if (allowed) { ' + pageCall + ' }')],
  ['a page read before authorization', pagePath, holderPage.replace(pageCall, "await db.from('private_records').select('*');\n" + pageCall)],
  ['a page return before authorization', pagePath, holderPage.replace(pageCall, 'return <PrivateRecords />;\n' + pageCall)],
  ['a swallowed loader denial', pagePath, holderPage.replace(pageCall, 'const workspace = await getProgramHolderWorkspace().catch(() => ({}));')],
  ['a loader imported from another module', pagePath, holderPage.replace("'@/lib/program-holder/workspace'", "'./unguarded-workspace'")],
  ['page parameter execution before authorization', pagePath, holderPage.replace('function Page()', 'function Page(value = readPrivateRecords())')],
  ['module execution before the page guard', pagePath, holderPage + '\nconst leaked = readPrivateRecords();'],
  ['a hoisted local function shadowing the loader import', pagePath, holderPage.replace(pageCall, pageCall + '\nfunction getProgramHolderWorkspace() { return {}; }')],
  ['an unused canonical guard import', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = {};')],
  ['a comment-only canonical guard', workspacePath, holderWorkspace.replace(guardCall, '// ' + guardCall + '\nconst ctx = {};')],
  ['an unawaited canonical guard', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = requireProgramHolder();')],
  ['a conditional canonical guard', workspacePath, holderWorkspace.replace(guardCall, 'if (allowed) { ' + guardCall + ' }')],
  ['a workspace read before authorization', workspacePath, holderWorkspace.replace(guardCall, "await db.from('program_holders').select('*');\n" + guardCall)],
  ['a workspace return before authorization', workspacePath, holderWorkspace.replace(guardCall, 'return {};\n' + guardCall)],
  ['a swallowed canonical guard denial', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await requireProgramHolder().catch(() => ({}));')],
  ['an optional canonical guard', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await requireProgramHolder?.();')],
  ['a parallel private read and guard', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await Promise.all([requireProgramHolder(), readPrivateRecords()]);')],
  ['weakened guard options', workspacePath, holderWorkspace.replace(guardCall, 'const ctx = await requireProgramHolder({ allowPendingApproval: true });')],
  ['a guard imported from another module', workspacePath, holderWorkspace.replace("'@/lib/auth/require-program-holder'", "'./fake-authority'")],
  ['a type-only guard import', workspacePath, holderWorkspace.replace('import { requireProgramHolder }', 'import type { requireProgramHolder }')],
  ['a guarded function that is not the actual exported loader', workspacePath, holderWorkspace.replace('export async function getProgramHolderWorkspace()', 'export async function unusedGuardedLoader()') + '\nexport async function getProgramHolderWorkspace() { return {}; }'],
  ['module execution before the workspace guard', workspacePath, holderWorkspace + '\nconst leaked = readPrivateRecords();'],
  ['a hoisted local function shadowing the guard import', workspacePath, holderWorkspace.replace(guardCall, guardCall + '\nfunction requireProgramHolder() { return {}; }')],
  ['a hoisted local variable shadowing the guard import', workspacePath, holderWorkspace.replace(guardCall, guardCall + '\nvar requireProgramHolder = () => ({});')],
  ['a computed module method that executes before authorization', workspacePath, holderWorkspace + '\nconst leaked = { [readPrivateRecords()]() {} };'],
]) {
  test(`the actual portal audit rejects ${label}`, () => {
    const original = path === pagePath ? holderPage : holderWorkspace;
    assert.notEqual(altered, original, 'regression mutation must change the actual source');
    const failures = auditHolder({ [join(repoRoot, path)]: altered });
    assert.equal(failures.length, 1, failures.join('\n'));
    assert.match(failures[0], /program-holder\/dashboard\/page\.tsx bypasses canonical requireProgramHolder/);
  });
}

const providerPath = 'apps/marketing/app/api/tenant-sites/cleaning/provider/route.ts';
const verificationPath = 'apps/marketing/app/api/tenant-sites/cleaning/provider/verification/route.ts';
const providerRoute = readFileSync(join(repoRoot, providerPath), 'utf8');
const verificationRoute = readFileSync(join(repoRoot, verificationPath), 'utf8');
const providerSources = {
  proof: readFileSync(join(repoRoot, 'lib/cleaning/provider-email-proof.ts'), 'utf8'),
  verification: readFileSync(join(repoRoot, 'lib/cleaning/provider-email-verification.ts'), 'utf8'),
};
const providerCall = 'const actor = await verifiedProviderEmail(user, session, db);';
const requestCall = 'const { browserNonce } = await requestProviderEmailVerification({ db, user, session });';
const signedCall = 'const actor = await verifiedProviderSession(user, session, false);';

function routeAudit(overrides = {}) {
  const cwd = mkdtempSync(join(tmpdir(), 'provider-route-authority-'));
  const files = {
    [providerPath]: providerRoute, [verificationPath]: verificationRoute,
    'lib/cleaning/provider-email-proof.ts': providerSources.proof,
    'lib/cleaning/provider-email-verification.ts': providerSources.verification,
    'apps/marketing/app/api/existing-guard/route.ts': 'export async function POST() { await requireUser(); return new Response(); }',
    ...overrides,
  };
  try {
    for (const [path, value] of Object.entries(files)) {
      const full = join(cwd, path); mkdirSync(join(full, '..'), { recursive: true }); writeFileSync(full, value);
    }
    return spawnSync(process.execPath, [join(repoRoot, 'scripts/check-unprotected-routes.mjs')], { cwd, encoding: 'utf8' });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}

test('the real route audit recognizes both proof-gated provider mutations without a baseline or public exemption', () => {
  assert.equal(hasCleaningProviderMutationGuard(providerRoute, providerSources), true);
  assert.equal(hasCleaningProviderMutationGuard(verificationRoute, providerSources), true);
  const checked = routeAudit();
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.match(checked.stdout, /0 baselined/);
});

test('the real route audit rejects both provider writers when their awaited authorization is removed', () => {
  const checked = routeAudit({
    [providerPath]: providerRoute.replaceAll(providerCall, 'const actor = user;'),
    [verificationPath]: verificationRoute.replace(requestCall, "const browserNonce = 'unverified';"),
  });
  assert.equal(checked.status, 1, checked.stdout + checked.stderr);
  assert.ok(checked.stderr.includes(providerPath));
  assert.ok(checked.stderr.includes(verificationPath));
  assert.ok(!checked.stderr.includes('existing-guard/route.ts'));
});

test('provider proof follows named-import aliases and exact canonical relative helper imports', () => {
  const route = providerRoute.replace('{ verifiedProviderEmail }', '{ verifiedProviderEmail as checkMailbox }')
    .replaceAll('await verifiedProviderEmail(', 'await checkMailbox(');
  assert.equal(hasCleaningProviderMutationGuard(route, providerSources), true);
  const verification = providerSources.verification
    .replace('{ verifiedProviderSession, type', '{ verifiedProviderSession as checkSession, type')
    .replaceAll('await verifiedProviderSession(', 'await checkSession(');
  assert.equal(hasCleaningProviderMutationGuard(verificationRoute, { ...providerSources, verification }), true);
});

test('verification routes cannot import a canonical session function that no longer exists', () => {
  const proof = providerSources.proof.replace('export async function verifiedProviderSession(', 'export async function unusedSessionHelper(');
  assert.notEqual(proof, providerSources.proof);
  assert.equal(hasCleaningProviderMutationGuard(verificationRoute, { ...providerSources, proof }), false);
});

for (const [label, target, transform] of [
  ['unused proof import', 'provider', source => source.replaceAll(providerCall, 'const actor = user;')],
  ['comment-only proof', 'provider', source => source.replaceAll(providerCall, '// ' + providerCall + '\nconst actor = user;')],
  ['unawaited proof', 'provider', source => source.replaceAll('await verifiedProviderEmail(', 'verifiedProviderEmail(')],
  ['swallowed proof denial', 'provider', source => source.replaceAll(providerCall, 'const actor = await verifiedProviderEmail(user, session, db).catch(() => user);')],
  ['conditional proof', 'provider', source => source.replaceAll(providerCall, 'if (allowed) { ' + providerCall + ' }')],
  ['a private read before proof', 'provider', source => source.replaceAll(providerCall, "await db.from('cleaning_providers').select('*');\n" + providerCall)],
  ['a private write before proof', 'provider', source => source.replaceAll(providerCall, "await db.from('cleaning_providers').update({opted_in:true});\n" + providerCall)],
  ['client-owned proof identity', 'provider', source => source.replaceAll('verifiedProviderEmail(user, session, db)', 'verifiedProviderEmail(user.user_metadata, session, db)')],
  ['another proof module', 'provider', source => source.replace("'@/lib/cleaning/provider-email-proof'", "'./untrusted-proof'")],
  ['type-only proof import', 'provider', source => source.replace('import { verifiedProviderEmail }', 'import type { verifiedProviderEmail }')],
  ['a hoisted function shadowing proof', 'provider', source => source.replaceAll(providerCall, providerCall + '\nfunction verifiedProviderEmail() { return {}; }')],
  ['missing same-origin check', 'provider', source => source.replace('sameOrigin(request);', '')],
  ['owner-mode context substituted for applicant context', 'provider', source => source.replaceAll("cleaningContext(request, false, 'provider-onboarding')", "cleaningContext(request, true, 'provider-onboarding')")],
  ['a private read before the wrapper', 'provider', source => source.replace('export async function POST(request: NextRequest) {', "export async function POST(request: NextRequest) { await db.from('private').select('*');")],
  ['parameter execution before authorization', 'provider', source => source.replace('POST(request: NextRequest)', 'POST(request: NextRequest = readPrivateData())')],
  ['module execution before authorization', 'provider', source => source + '\nconst leaked = readPrivateData();'],
  ['a module parse that executes a refinement', 'provider', source => source + "\nconst leaked = z.string().refine(() => readPrivateData()).parse('value');"],
  ['a private call inside schema construction', 'provider', source => source + '\nconst leaked = z.object({ value: readPrivateData() });'],
  ['another unprotected mutation export', 'provider', source => source + '\nexport async function DELETE(request: NextRequest) { return reply({ok:true}); }'],
  ['a request without an awaited verifier', 'verification', source => source.replace(requestCall, "const browserNonce = 'unverified';")],
  ['an unawaited verification request', 'verification', source => source.replace('await requestProviderEmailVerification(', 'requestProviderEmailVerification(')],
  ['swallowed request authorization', 'verification', source => source.replace(requestCall, 'const { browserNonce } = await requestProviderEmailVerification({ db, user, session }).catch(() => ({}));')],
  ['a request imported from another module', 'verification', source => source.replace("'@/lib/cleaning/provider-email-verification'", "'./untrusted-verification'")],
  ['a local function shadowing the verifier', 'verification', source => source.replace(requestCall, requestCall + '\nfunction requestProviderEmailVerification() { return {}; }')],
  ['a private read before verification', 'verification', source => source.replace(requestCall, "await db.from('private').select('*');\n" + requestCall)],
  ['client-owned email in the verification request', 'verification', source => source.replace('{ db, user, session });', '{ db, user: { ...user, email: suppliedEmail }, session });')],
  ['client-owned flow options in the verification request', 'verification', source => source.replace('{ db, user, session });', '{ db, user, session, config: suppliedConfig });')],
  ['duplicate flow keys hiding earlier execution', 'verification', source => source.replace('{ db, user, session });', '{ db: readPrivateData(), db, user, session });')],
  ['a prototype key hiding earlier execution', 'verification', source => source.replace('{ db, user, session });', '{ db, user, session, __proto__: readPrivateData() });')],
  ['missing fixed-origin enforcement', 'verification', source => source.replace('requireProviderVerificationOrigin(request);', '')],
  ['missing strict empty body validation', 'verification', source => source.replace('z.object({}).strict().parse(await request.json());', '')],
  ['accepting a client email in the request body', 'verification', source => source.replace('z.object({}).strict()', 'z.object({ email: z.string() }).strict()')],
  ['a verification helper without session authorization', 'helper', source => source.replace(signedCall, 'const actor = user;')],
  ['a verification helper with unawaited authorization', 'helper', source => source.replace(signedCall, 'const actor = verifiedProviderSession(user, session, false);')],
  ['a verification helper swallowing authorization failure', 'helper', source => source.replace(signedCall, 'const actor = await verifiedProviderSession(user, session, false).catch(() => user);')],
  ['a verification helper reading private data first', 'helper', source => source.replace(signedCall, "await db.from('private').select('*');\n" + signedCall)],
  ['a verification helper shadowing canonical authorization', 'helper', source => source.replace(signedCall, signedCall + '\nfunction verifiedProviderSession() { return {}; }')],
  ['a verification helper importing false authority', 'helper', source => source.replace("'./provider-email-proof'", "'./false-authority'")],
  ['a verification helper with executable parameter defaults', 'helper', source => source.replace('({ db, user, session, ...options }:', '({ db, user = readPrivateData(), session, ...options }:')],
  ['a proof helper skipping magic-link authorization', 'proof', source => source.replace('const actor = await verifiedProviderSession(user, session);', 'const actor = await verifiedProviderSession(user, session, false);')],
  ['a proof helper using another receipt RPC', 'proof', source => source.replace("'cleaning_provider_proof_valid'", "'always_allow'")],
  ['a proof helper accepting truthy receipt data', 'proof', source => source.replace('if (error || data !== true)', 'if (error || !data)')],
  ['a proof helper returning instead of rejecting a denial', 'proof', source => source.replace('throw providerVerificationRequired();\n  return { id: actor.id', 'return providerVerificationRequired();\n  return { id: actor.id')],
  ['a proof helper omitting the session binding', 'proof', source => source.replace('p_session_id: actor.sessionId', "p_session_id: 'another-session'")],
  ['a proof helper accepting a caller-chosen website default', 'proof', source => source.replace('websiteId = CLEANING_SITE', 'websiteId = suppliedWebsite()')],
]) {
  test(`provider route authorization rejects ${label}`, () => {
    const original = target === 'provider' ? providerRoute : target === 'verification' ? verificationRoute :
      target === 'helper' ? providerSources.verification : providerSources.proof;
    const altered = transform(original);
    assert.notEqual(altered, original, 'the regression must mutate the actual implementation');
    const route = target === 'provider' ? altered : target === 'verification' ? altered :
      target === 'helper' ? verificationRoute : providerRoute;
    const sources = { ...providerSources,
      ...(target === 'helper' ? { verification: altered } : {}),
      ...(target === 'proof' ? { proof: altered } : {}),
    };
    assert.equal(hasCleaningProviderMutationGuard(route, sources), false);
  });
}
