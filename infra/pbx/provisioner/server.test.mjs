import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createProvisioner, endpointFor, parseContacts, renderConfiguration, validateIdentity } from './server.mjs';

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

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'elevate-pbx-test-'));
  let authorized = true; let contact = false; let reachable = false;
  let rejectNextReadback = false;
  let clock = Date.now();
  const config = { token: 'fixture-only-'.repeat(4), phoneSystemId: '55555555-5555-4555-8555-555555555555',
    supabaseKey: 'fixture-only', supabaseUrl: 'https://example.invalid', container: 'fixture',
    asteriskGid: process.getgid(), sipDomain: 'phone.elevateforhumanity.org', wsUrl: 'wss://phone.elevateforhumanity.org/ws', generatedRoot: root };
  const service = createProvisioner(config, {
    now: () => clock,
    fetch: async url => ({ ok: true, json: async () => {
      if (String(url).includes('phone_webrtc_devices')) return [{ id: 'fixture' }];
      return authorized ? [{ id: identity.extensionId, profile_id: identity.profileId, extension: '101',
        enabled: true, webrtc_provider: 'asterisk', ring_seconds: 20, ring_mode: 'ring', availability_source: 'manual',
        communication_workspaces: { phone_system_id: config.phoneSystemId, phone_systems: { admin_extension: '101', timezone: record.timezone, status: 'active' } } }] : [];
    } }),
    command: async cmd => {
      if (cmd.endsWith('reload')) return 'Reloaded';
      const cfg = await readFile(path.join(root, 'current', 'pjsip.conf'), 'utf8').catch(() => '');
      if (!cfg.includes(endpoint)) return 'Unable to find object';
      if (cmd.startsWith('pjsip show endpoint')) {
        if (rejectNextReadback) { rejectNextReadback = false; return 'Unable to find object'; }
        return `Endpoint: ${endpoint}/101\ncontext : elevate-pwa \nauth : ${endpoint}-auth \naors : ${endpoint} \nmedia_encryption : dtls \n`;
      }
      if (cmd.startsWith('dialplan show')) return readFile(path.join(root, 'current','extensions.conf'), 'utf8');
      return `Aor: ${endpoint} 1\n${contact ? `Contact: ${endpoint}/sip:fixture hash ${reachable ? 'Avail' : 'Unavail'} 1.0` : ''}`;
    },
  });
  await service.initialize();
  await new Promise(resolve => service.server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { service.server.closeAllConnections(); await new Promise(resolve => service.server.close(resolve)); await rm(root,{recursive:true,force:true}); });
  const request = async (action = '', auth = true, body = identity) => {
    const response = await fetch(`http://127.0.0.1:${service.server.address().port}/internal/pbx/devices${action}`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...(auth ? { authorization: `Bearer ${config.token}` } : {}) }, body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  };
  return { request, service, root, deny: () => authorized = false, contacts: (a,b) => {contact=a;reachable=b;},
    reject: () => rejectNextReadback = true, expire: () => clock += 700000 };
}
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
