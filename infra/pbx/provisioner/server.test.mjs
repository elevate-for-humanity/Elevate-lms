import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, readlink, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { reportFailure, createProvisioner, endpointFor, parseContacts, renderConfiguration, validateIdentity } from './server.mjs';

const identity = { profileId: '11111111-1111-4111-8111-111111111111', extensionId: '22222222-2222-4222-8222-222222222222', deviceId: 'asterisk_fixture_device' };
const endpoint = endpointFor(identity);
const record = { ...identity, endpointId: endpoint, password: 'a'.repeat(43), extension: '101', ringSeconds: 20,
  expiresAt: Date.now() + 600000, adminExtension: '101', timezone: 'America/Indiana/Indianapolis',
  ringMode: 'ring', availabilitySource: 'manual', availabilitySchedule: {} };

test('rejects config injection and cross-owner extension collisions before generating config', () => {
  assert.throws(() => validateIdentity({ ...identity, deviceId: 'bad\ncontext=internal' }));
  assert.throws(() => renderConfiguration([{ ...record, extension: '101\ninclude=pstn-out' }]));
  const second = { ...record, profileId: '33333333-3333-4333-8333-333333333333', extensionId: '44444444-4444-4444-8444-444444444444' };
  second.endpointId = endpointFor(second);
  assert.throws(() => renderConfiguration([record, second]), /duplicate_extension/);
});
test('generated endpoints require independent SIP auth, DTLS and internal-only contexts', () => {
  const config = renderConfiguration([record]);
  assert.match(config.pjsip, /media_encryption=dtls/);
  assert.match(config.pjsip, /auth=pwa-[a-f0-9]+-auth/);
  assert.match(config.pjsip, /context=elevate-pwa/);
  assert.doesNotMatch(config.pjsip, /sip.telnyx|pstn-out/);
  assert.match(config.dialplan, /exten => 0,1,Gosub\(elevate-pwa-extensions,101,1\)/);
  assert.match(config.dialplan, /PJSIP_DIAL_CONTACTS/);
});
test('DND and a closed schedule do not ring devices', () => {
  const dnd = renderConfiguration([{ ...record, ringMode: 'do_not_disturb' }]).dialplan;
  assert.doesNotMatch(dnd, /PJSIP_DIAL_CONTACTS/);
  const scheduled = renderConfiguration([{ ...record, availabilitySource: 'schedule', availabilitySchedule: { mon: ['09:00','17:00'] } }]).dialplan;
  assert.match(scheduled, /09:00-16:59,mon/);
  assert.match(scheduled, /Goto\(unavailable\)/);
});
test('contact existence and qualified reachability are distinct', () => {
  assert.deepEqual(parseContacts(`Aor: ${endpoint} 1\nContact: ${endpoint}/sip:x unknown Unavail 0.0`, endpoint), { contactCount: 1, reachableContactCount: 0 });
  assert.deepEqual(parseContacts(`Aor: ${endpoint} 1\nContact: ${endpoint}/sip:x unknown Avail 1.0`, endpoint), { contactCount: 1, reachableContactCount: 1 });
  assert.throws(() => parseContacts('No such AOR', endpoint));
});
test('Asterisk 20 clipped AOR columns retain exact-query identity and full contact IDs', () => {
  const output = `Aor: ${endpoint.slice(0, 41)} 1\nContact: ${endpoint}/sip:fixture hash Avail 1.0`;
  assert.deepEqual(parseContacts(output, endpoint), { contactCount: 1, reachableContactCount: 1 });
  assert.throws(() => parseContacts(`Aor: ${endpoint.slice(0, 40)} 1`, endpoint));
  assert.throws(() => parseContacts(`Aor: pwa-${'f'.repeat(37)} 1`, endpoint));
  assert.throws(() => parseContacts(`Aor: ${endpoint} 2`, endpoint));
});

async function fixture(t, options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'elevate-pbx-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  if (options.legacyEmpty) {
    const generation = 'generation-' + 'a'.repeat(24);
    await mkdir(path.join(root, generation));
    for (const [name, content] of [['state.json', '[]'], ['pjsip.conf', ''], ['extensions.conf', '[elevate-pwa-extensions]\n']]) {
      await writeFile(path.join(root, generation, name), content);
    }
    await symlink(generation, path.join(root, 'current'));
  }
  const failures = []; let injected = [];
  let authorized = true; let contact = false; let reachable = false;
  let rejectedReadbacks = 0; let staleRemovals = 0; let waits = 0;
  let reloads = 0; let operatorMissing = options.operatorMissing || false;
  let clock = Date.now();
  const config = { token: 'fixture-only-'.repeat(4), phoneSystemId: '55555555-5555-4555-8555-555555555555',
    supabaseKey: 'fixture-only', supabaseUrl: 'https://example.invalid', container: 'fixture',
    asteriskGid: process.getgid(), sipDomain: 'phone.elevateforhumanity.org', wsUrl: 'wss://phone.elevateforhumanity.org/ws', generatedRoot: root };
  const service = createProvisioner(config, {
    now: () => clock,
    writeFailure: line => failures.push(line),
    wait: async () => { waits++; },
    fetch: async url => ({ ok: true, json: async () => {
      if (String(url).includes('phone_webrtc_devices')) return [{ id: 'fixture' }];
      return authorized ? [{ id: identity.extensionId, profile_id: identity.profileId, extension: '101',
        enabled: true, webrtc_provider: 'asterisk', ring_seconds: 20, ring_mode: 'ring', availability_source: 'manual',
        communication_workspaces: { phone_system_id: config.phoneSystemId, phone_systems: { admin_extension: '101', timezone: record.timezone, status: 'active' } } }] : [];
    } }),
    command: async cmd => {
      if (cmd === 'module reload res_pjsip.so' && injected.length) {
        const result = injected.shift();
        if (result instanceof Error) throw result;
        return result;
      }
      if (cmd === 'pjsip reload') throw Error('Optional CLI aliases are not installed');
      if (cmd === 'module reload res_pjsip.so' || cmd === 'dialplan reload') { reloads++; return 'Reloaded'; }
      if (cmd.startsWith('dialplan show')) {
        if (cmd === 'dialplan show 0@elevate-pwa-extensions' && operatorMissing) return 'No such extension';
        return readFile(path.join(root, 'current','extensions.conf'), 'utf8');
      }
      const cfg = await readFile(path.join(root, 'current', 'pjsip.conf'), 'utf8').catch(() => '');
      if (!cfg.includes(endpoint)) {
        if (cmd.startsWith('pjsip show endpoint') && staleRemovals-- > 0) return `Endpoint: ${endpoint}/101`;
        return 'Unable to find object';
      }
      if (cmd.startsWith('pjsip show endpoint')) {
        if (rejectedReadbacks-- > 0) return 'Unable to find object';
        return `Endpoint: ${endpoint}/101\ncontext : elevate-pwa \nauth : ${endpoint}-auth \naors : ${endpoint} \nmedia_encryption : dtls \n`;
      }
      return `Aor: ${endpoint} 1\n${contact ? `Contact: ${endpoint}/sip:fixture hash ${reachable ? 'Avail' : 'Unavail'} 1.0` : ''}`;
    },
  });
  await service.initialize();
  await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { service.server.closeAllConnections(); await new Promise(resolve => service.server.close(resolve)); });
  const request = async (action = '', auth = true, body = identity) => {
    const response = await fetch(`http://127.0.0.1:${service.server.address().port}/internal/pbx/devices${action}`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${config.token}` } : {}) }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  return { request, service, root, failures, inject: (...values) => injected = values, deny: () => authorized = false, contacts: (a,b) => {contact=a;reachable=b;},
    reloads: () => reloads, loseOperator: () => operatorMissing = true,
    reject: (count = 12) => rejectedReadbacks = count, delayRemoval: count => staleRemovals = count, waits: () => waits, advance: ms => clock += ms, expire: () => clock += 700000 };
}

for (const legacyEmpty of [false, true]) {
  test(`startup materializes and verifies operator routing with ${legacyEmpty ? 'legacy' : 'new'} empty state`, async t => {
    const f = await fixture(t, { legacyEmpty });
    const plan = await readFile(path.join(f.root, 'current', 'extensions.conf'), 'utf8');
    assert.match(plan, /exten => 0,1,Set\(PWA_CONTACTS=\)/);
    assert.match(plan, /Set\(DIALSTATUS=CHANUNAVAIL\)/);
    const generation = await readlink(path.join(f.root, 'current'));
    const reloads = f.reloads();
    await f.service.reconcile();
    assert.equal(await readlink(path.join(f.root, 'current')), generation);
    assert.equal(f.reloads(), reloads, 'healthy reconciliation must not reload Asterisk');
    f.loseOperator();
    await assert.rejects(f.service.reconcile(), /asterisk_dialplan_unverified/);
  });
}
test('startup refuses a listener when Asterisk never loads the operator route', async t => {
  await assert.rejects(fixture(t, { operatorMissing: true }), /asterisk_rollback_failed|asterisk_dialplan_unverified/);
});
test('requires control-plane auth and independently verified Supabase ownership', async t => {
  const f = await fixture(t);
  assert.equal((await f.request('',false)).status,401);
  f.deny(); assert.equal((await f.request()).status,403);
});
test('provisioning is offline until Asterisk observes a qualified contact; revoke removes auth', async t => {
  const f = await fixture(t); const provision = await f.request();
  assert.equal(provision.status,200); assert.equal(provision.body.connectionState,'disconnected');
  assert.match(provision.body.sipPassword,/^[A-Za-z0-9_-]{43}$/);
  assert.equal((await f.request('/status')).body.registered,false);
  f.contacts(true,false); assert.equal((await f.request('/status')).body.connectionState,'disconnected');
  f.contacts(true,true); assert.equal((await f.request('/status')).body.connectionState,'connected');
  assert.equal((await f.request('/revoke')).body.revoked,true);
  assert.equal((await f.request('/status')).body.registered,false);
});
test('a failed runtime readback rolls back and never returns credentials', async t => {
  const f = await fixture(t);f.reject(); const attempt=await f.request();
  assert.equal(attempt.status,503);assert.equal(attempt.body.sipPassword,undefined);
  assert.equal((await f.request('/status')).body.registered,false);
  assert.equal((await f.request()).status,200);
});
test('expired and disabled owner credentials are removed by reconciliation',async t=>{
  const f=await fixture(t);assert.equal((await f.request()).status,200);
  f.expire();await f.service.pruneExpired();assert.equal((await f.request('/status')).body.registered,false);
  assert.equal((await f.request()).status,200);f.deny();await f.service.reconcile();
  const cfg=await readFile(path.join(f.root,'current','pjsip.conf'),'utf8');assert.doesNotMatch(cfg,/password=/);
});

test('an expired lease leaves a dormant subroutine that can still wake a closed app', async t => {
  const f = await fixture(t);
  assert.equal((await f.request()).status, 200);
  f.expire();
  await f.service.pruneExpired();
  const plan = await readFile(path.join(f.root, 'current', 'extensions.conf'), 'utf8');
  // The extension subroutine and its wake hook survive the lease lapse...
  assert.ok(plan.includes('exten => 101,1,Set(PWA_CONTACTS=)'));
  assert.ok(plan.includes(' same => n,Set(WAKE_TRIES=0)'));
  assert.ok(plan.includes('call-alert'));
  // ...but the retained record's contacts stay gated behind the lapsed expiry.
  assert.match(plan, /ExecIf\(\$\[\$\{EPOCH\}<\d+\]\?Set\(PWA_DEVICE_CONTACTS=/);
  const state = JSON.parse(await readFile(path.join(f.root, 'current', 'state.json'), 'utf8'));
  assert.equal(state.length, 1);
  // A repeat prune with the same dormant record is a no-op: no new
  // generation and no extra Asterisk reloads.
  const generation = await readlink(path.join(f.root, 'current'));
  const reloads = f.reloads();
  await f.service.pruneExpired();
  assert.equal(await readlink(path.join(f.root, 'current')), generation);
  assert.equal(f.reloads(), reloads);
  // Reconciliation keeps the dormant record while the owner stays authorized.
  await f.service.reconcile();
  const planAfter = await readFile(path.join(f.root, 'current', 'extensions.conf'), 'utf8');
  assert.ok(planAfter.includes(' same => n,Set(WAKE_TRIES=0)'));
});

test('reconciliation drops a dormant record whose owner is no longer authorized', async t => {
  const f = await fixture(t);
  assert.equal((await f.request()).status, 200);
  f.expire();
  await f.service.pruneExpired();
  f.deny();
  await f.service.reconcile();
  const plan = await readFile(path.join(f.root, 'current', 'extensions.conf'), 'utf8');
  assert.doesNotMatch(plan, /WAKE_TRIES/);
  const state = JSON.parse(await readFile(path.join(f.root, 'current', 'state.json'), 'utf8'));
  assert.equal(state.length, 0);
});

test('an expired record still renders the wake window while its contacts stay expiry-gated', () => {
  const expired = { ...record, expiresAt: Date.now() - 60000 };
  const plan = renderConfiguration([expired], { callAlertToken: wakeToken }).dialplan;
  assert.ok(plan.includes(' same => n,Set(WAKE_TRIES=0)'));
  assert.ok(plan.includes('call-alert'));
  assert.match(plan, /ExecIf\(\$\[\$\{EPOCH\}<\d+\]\?Set\(PWA_DEVICE_CONTACTS=/);
});

test('asynchronous Asterisk apply and revocation settle before acceptance', async t => {
  const f = await fixture(t);
  f.reject(2);
  const attempt = await f.request();
  assert.equal(attempt.status, 200);
  assert.equal(f.waits(), 2);
  f.delayRemoval(2);
  assert.equal((await f.request('/revoke')).body.revoked, true);
  assert.equal(f.waits(), 4);
  assert.equal((await f.request('/status')).status, 200);
});

test('multiple devices owned by the same extension render independent endpoints and one ring group', () => {
  const otherIdentity = { ...identity, deviceId: 'asterisk_second_device' };
  const second = { ...record, ...otherIdentity, endpointId: endpointFor(otherIdentity) };
  const config = renderConfiguration([record, second]);
  assert.ok(config.pjsip.includes(endpoint));
  assert.ok(config.pjsip.includes(second.endpointId));
  assert.equal(config.dialplan.split('exten => 101,1,Set(PWA_CONTACTS=)').length - 1, 1);
  assert.ok(config.dialplan.includes('PJSIP_DIAL_CONTACTS(' + second.endpointId + ')'));
});


test('empty device fleet retains an explicit unavailable operator subroutine',()=>{
 const config=renderConfiguration([]);
 assert.match(config.dialplan,/\[elevate-pwa-extensions\]\nexten => 0,1,Set\(PWA_CONTACTS=\)\n same => n,Set\(DIALSTATUS=CHANUNAVAIL\)\n same => n,Return\(\)/);
 assert.doesNotMatch(config.dialplan,/PJSIP_DIAL_CONTACTS/);
});
test('a leased non-admin device cannot become the operator when the admin is offline',()=>{
 const config=renderConfiguration([{...record,adminExtension:'102'}]);
 assert.match(config.dialplan,/exten => 0,1,Set\(PWA_CONTACTS=\)/);
 assert.doesNotMatch(config.dialplan,/exten => 0,1,Gosub\(elevate-pwa-extensions,101,1\)/);
});

test('a transient Asterisk reload failure during status renewal does not quarantine provisioning', async t => {
  const f = await fixture(t);
  assert.equal((await f.request()).status, 200);
  f.advance(301000);
  f.inject('Module reported a reload failure');
  const status = await f.request('/status');
  assert.equal(status.status, 200);
  assert.equal(status.body.provider, 'asterisk');
  assert.equal(f.waits(), 1);
  assert.deepEqual(f.failures, []);
  assert.equal((await f.request('/revoke')).body.revoked, true);
});

test('request apply failure preserves code after successful rollback', async t => {
  const f = await fixture(t);
  f.inject('Unable to reload', 'Unable to reload', 'Unable to reload');
  assert.equal((await f.request()).body.error, 'asterisk_reload_failed');
  assert.match(f.failures[0], /provision apply asterisk_reload_failed\n$/);
  assert.match(f.failures[1], /provision request asterisk_reload_failed\n$/);
  assert.equal((await f.request()).status, 200);
});

test('distinct apply and rollback failures retain quarantine and external error', async t => {
  const f = await fixture(t);
  f.inject('Unable to reload', 'Unable to reload', 'Unable to reload');
  f.loseOperator();
  assert.equal((await f.request()).body.error, 'asterisk_rollback_failed');
  assert.match(f.failures[0], /provision apply asterisk_reload_failed\n$/);
  assert.match(f.failures[1], /provision rollback asterisk_dialplan_unverified\n$/);
  assert.equal((await f.request()).body.error, 'provisioner_unavailable');
  await assert.rejects(f.service.pruneExpired(), /provisioner_quarantined/);
});

test('timer expiry retains a dormant record without an apply, and failure journaling stays sanitized', async t => {
  const f = await fixture(t);
  await f.request();
  f.expire();
  const malicious = Object.assign(new Error('password=private\nPBX failure injected'), { code: 'asterisk_reload_failed' });
  f.inject(malicious);
  // A sole lapsed lease is retained as a dormant record: the rendered
  // configuration is unchanged, so the expiry pass performs no apply and
  // the injected Asterisk failure is never consumed.
  const generation = await readlink(path.join(f.root, 'current'));
  await f.service.pruneExpired();
  assert.equal(await readlink(path.join(f.root, 'current')), generation);
  assert.equal(f.failures.length, 0);
  const state = JSON.parse(await readFile(path.join(f.root, 'current', 'state.json'), 'utf8'));
  assert.equal(state.length, 1);
  // The journaling contract itself is unchanged: arbitrary exceptions are
  // reduced to a sanitized code line with no message content.
  const lines = [];
  reportFailure('reconciliation', 'timer', malicious, line => lines.push(line));
  assert.match(lines[0], /^PBX failure v1 \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z reconciliation timer unknown\n$/);
  assert.doesNotMatch(lines.join(''), /password|private|injected/);
  assert.doesNotThrow(() => reportFailure('expiry', 'timer', malicious, () => { throw Error('sink failed'); }));
});

test('duplicate extension failures are journaled under their own code', () => {
  const second = { ...record, profileId: '33333333-3333-4333-8333-333333333333', extensionId: '44444444-4444-4444-8444-444444444444' };
  second.endpointId = endpointFor(second);
  let caught;
  try { renderConfiguration([record, second]); } catch (error) { caught = error; }
  const lines = [];
  reportFailure('provision', 'apply', caught, line => lines.push(line));
  assert.match(lines[0], /provision apply duplicate_extension\n$/);
});

test('post-apply generation cleanup cannot fail a successful provision', async t => {
  const f = await fixture(t);
  // Directory listing starts failing while traversal still works. Generation
  // cleanup runs only after the credential is applied and verified, so the
  // provision must still succeed and return the credential.
  await chmod(f.root, 0o311);
  try {
    const provision = await f.request();
    assert.equal(provision.status, 200);
    assert.match(provision.body.sipPassword, /^[A-Za-z0-9_-]{43}$/);
  } finally {
    await chmod(f.root, 0o755);
  }
});

test('control-plane request timeout covers the verification settling budget', async t => {
  const f = await fixture(t);
  assert.equal(f.service.server.requestTimeout, 60000);
});

const wakeToken = 'fixture-wake-token-'.repeat(3);

test('rendering without a wake token keeps the legacy subroutine byte shape', () => {
  const config = renderConfiguration([record]);
  assert.doesNotMatch(config.dialplan, /call-alert|WAKE_|Ringing\(\)|Wait\(2\)|System\(/);
  assert.ok(config.dialplan.includes(' same => n,Dial(${PWA_CONTACTS},20)'));
  assert.ok(config.dialplan.includes(' same => n,GotoIf($[${LEN(${PWA_CONTACTS})}=0]?unavailable)'));
});

test('wake rendering hooks only the empty-contact path and waits bounded for a registration', () => {
  const config = renderConfiguration([record], { callAlertToken: wakeToken });
  const plan = config.dialplan;
  assert.ok(plan.includes('exten => 0,1,Gosub(elevate-pwa-extensions,101,1)'), 'operator stub still routes to the subroutine');
  assert.ok(plan.includes(' same => n,Set(WAKE_TRIES=0)'));
  assert.ok(plan.includes(' same => n(scan),Set(PWA_CONTACTS=)'));
  assert.equal(plan.split('System(').length - 1, 1, 'exactly one wake hook per extension subroutine');
  assert.ok(plan.includes(`Authorization: Bearer ${wakeToken}`));
  assert.ok(plan.includes('https://admin.elevateforhumanity.org/api/internal/phone/call-alert'));
  assert.ok(plan.includes('"extension":"${EXTEN}"'));
  assert.ok(plan.includes('"caller":"${WAKE_CALLER}"'));
  assert.ok(plan.includes('-m 2'), 'hook transport is capped at 2s');
  assert.ok(plan.includes(' same => n,Ringing()'));
  assert.ok(plan.includes(' same => n(wakewait),Wait(2)'));
  assert.ok(plan.includes(' same => n,GotoIf($[${WAKE_TRIES}<20]?scan)'), 'window is bounded at 20 tries x 2s');
  assert.ok(plan.includes(' same => n(dial),Dial(${PWA_CONTACTS},20)'));
  const dialBranch = plan.indexOf('GotoIf($[${LEN(${PWA_CONTACTS})}>0]?dial)');
  const hook = plan.indexOf('call-alert');
  const wait = plan.indexOf('(wakewait),Wait(2)');
  const dial = plan.indexOf('(dial),Dial(');
  assert.ok(dialBranch > -1 && dialBranch < hook, 'a first-scan contact skips the wake block entirely');
  assert.ok(hook < wait && wait < dial, 'hook fires before the wait; Dial only after a scan finds a contact');
  assert.ok(plan.indexOf(' same => n,Goto(unavailable)') > wait, 'window expiry falls through to unavailable');
});

test('an unembeddable wake token renders the legacy subroutine instead of an injectable hook', () => {
  for (const bad of ["tok'en-".repeat(8), 'short', 'has space '.repeat(5), 'dollar$ign'.repeat(5)]) {
    const config = renderConfiguration([record], { callAlertToken: bad });
    assert.doesNotMatch(config.dialplan, /call-alert|WAKE_|System\(/);
    assert.ok(config.dialplan.includes(' same => n,Dial(${PWA_CONTACTS},20)'));
  }
});

test('wake rendering never enters muted modes, a closed schedule, or the empty-fleet stub', () => {
  const dnd = renderConfiguration([{ ...record, ringMode: 'do_not_disturb' }], { callAlertToken: wakeToken }).dialplan;
  assert.doesNotMatch(dnd, /call-alert|WAKE_|PJSIP_DIAL_CONTACTS/);
  const scheduled = renderConfiguration([{ ...record, availabilitySource: 'schedule', availabilitySchedule: {} }], { callAlertToken: wakeToken }).dialplan;
  assert.ok(scheduled.includes(' same => n,Goto(unavailable)'), 'closed schedule still exits before the ring group');
  assert.ok(scheduled.indexOf('Goto(unavailable)') < scheduled.indexOf('(available)'), 'schedule exit precedes the wake block');
  const empty = renderConfiguration([], { callAlertToken: wakeToken }).dialplan;
  assert.doesNotMatch(empty, /call-alert|WAKE_/);
  assert.ok(empty.includes('exten => 0,1,Set(PWA_CONTACTS=)'));
});

test('a rollback whose first reload fails transiently recovers without quarantining', async t => {
  const f = await fixture(t);
  assert.equal((await f.request()).status, 200);
  f.advance(301000);
  // Forward apply exhausts its reload retries; the rollback's first reload
  // hits a one-off docker exec failure. The bounded rollback retry must
  // absorb it: original error preserved, no rollback journal, no latch.
  f.inject('Unable to reload', 'Unable to reload', 'Unable to reload', new Error('docker exec unavailable'));
  const status = await f.request('/status');
  assert.equal(status.body.error, 'asterisk_reload_failed');
  assert.match(f.failures[0], /status apply asterisk_reload_failed\n$/);
  assert.equal(f.failures.some(line => / rollback /.test(line)), false, 'a recovered rollback is not journaled as a rollback failure');
  assert.equal((await f.request('/status')).status, 200, 'provisioning is not quarantined after a recovered rollback');
});
