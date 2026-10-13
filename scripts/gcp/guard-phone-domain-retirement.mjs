import {verifyDns, verifyTls} from './verify-production-dns.mjs';
import {verifySipUpgrade} from './verify-pbx-transport.mjs';

const host = 'phone.elevateforhumanity.org';
const address = '107.178.216.162';

// This is a transport prerequisite for domain retirement, NOT telephone call acceptance.
// Any uncertain or failed check blocks destructive removal of Northflank registrations.
export async function requirePhoneTransport({
  dnsCheck = verifyDns,
  tlsCheck = verifyTls,
  healthCheck = async () => {
    const response = await fetch(`https://${host}/healthz`, {
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000),
    });
    const healthy = response.status === 200;
    await response.body?.cancel();
    return healthy;
  },
  wsCheck = verifySipUpgrade,
} = {}) {
  try {
    const dns = await dnsCheck(host, [address]);
    if (dns?.passed !== true) throw new Error('dns');
    const tls = await tlsCheck(host);
    if (tls?.passed !== true || tls?.hostnameValid !== true) throw new Error('tls');
    if (await healthCheck() !== true) throw new Error('health');
    const websocket = await wsCheck();
    if (websocket?.result !== 'PASS') throw new Error('sip_websocket');
  } catch {
    throw new Error('phone_transport_unverified_domain_retirement_blocked');
  }
  return {dns: 'PASS', tls: 'PASS', health: 'PASS', sipWebSocket: 'PASS', callAcceptance: 'NOT TESTED'};
}
