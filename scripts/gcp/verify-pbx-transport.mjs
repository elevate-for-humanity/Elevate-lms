import { createHash, randomBytes } from 'node:crypto';
import https from 'node:https';
import { writeFile } from 'node:fs/promises';
import { verifyDns, verifyTls } from './verify-production-dns.mjs';
const host = 'phone.elevateforhumanity.org';

export function websocketAccept(key) {
  return createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
}
export function verifySipUpgrade() {
  return new Promise(resolve => {
    const key = randomBytes(16).toString('base64');
    const request = https.request({ hostname: host, path: '/ws', method: 'GET',
      rejectUnauthorized: true, headers: { Connection: 'Upgrade', Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13', 'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Protocol': 'sip', Origin: 'https://app.elevateforhumanity.org' } });
    const timer = setTimeout(() => request.destroy(new Error('timeout')), 10000);
    const finish = result => { clearTimeout(timer); resolve(result); };
    request.once('upgrade', (response, socket) => {
      const passed = response.statusCode === 101 && response.headers['sec-websocket-accept'] === websocketAccept(key)
        && response.headers['sec-websocket-protocol'] === 'sip';
      socket.destroy(); finish({ result: passed ? 'PASS' : 'FAIL', evidence: 'SIP protocol WebSocket upgrade only; no registration or audio proved' });
    });
    request.once('response', response => { response.resume(); finish({ result: 'FAIL', evidence: { httpStatus: response.statusCode } }); });
    request.once('error', () => finish({ result: 'BLOCKED', evidence: 'trusted_transport_connection_unavailable' }));
    request.end();
  });
}
export async function main() {
  const checks = {};
  try { const evidence = verifyDns(host, ['107.178.216.162']); checks.DNS = { result: evidence.passed ? 'PASS' : 'FAIL', evidence }; }
  catch { checks.DNS = { result: 'BLOCKED', evidence: 'authoritative_dns_unavailable' }; }
  const tls = await verifyTls(host);
  checks.TLS = { result: tls.passed ? 'PASS' : 'FAIL', evidence: tls };
  try {
    const response = await fetch(`https://${host}/healthz`, { redirect: 'error', signal: AbortSignal.timeout(10000), cache: 'no-store' });
    checks.HEALTH_ENDPOINT = { result: response.ok ? 'PASS' : 'FAIL', evidence: { httpStatus: response.status, scope: 'gateway_only' } };
    await response.body?.cancel();
  } catch { checks.HEALTH_ENDPOINT = { result: 'BLOCKED', evidence: 'gateway_unreachable' }; }
  checks.SIP_WEBSOCKET = await verifySipUpgrade();
  checks.PHONE_CALL = { result: 'NOT TESTED', evidence: 'transport evidence is insufficient for calling readiness' };
  await writeFile('pbx-transport-evidence.json', JSON.stringify({ checkedAt: new Date().toISOString(), checks }, null, 2));
  console.log(JSON.stringify({ checks }));
  if (Object.values(checks).some(check => ['FAIL', 'BLOCKED'].includes(check.result))) process.exitCode = 1;
}
if (process.argv[1]?.endsWith('/verify-pbx-transport.mjs')) await main();
