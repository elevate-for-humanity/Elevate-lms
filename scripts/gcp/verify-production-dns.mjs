import { execFileSync } from 'node:child_process';
import tls from 'node:tls';
import { isIP } from 'node:net';

const zone = 'elevateforhumanity.org';
const normalized = value => value.toLowerCase().replace(/\.$/, '');
const safeHost = value => /^[a-z0-9.-]+$/.test(value) && !value.startsWith('-');
export function parseAnswer(output) {
  const authoritative = /flags:[^;]*\baa\b/.test(output);
  const status = /status: ([A-Z]+)/.exec(output)?.[1];
  const records = output.split('\n').filter(x => x && !x.startsWith(';')).map(line => {
    const [name, ttl, klass, type, ...data] = line.trim().split(/\s+/);
    return { name: normalized(name), ttl: Number(ttl), klass, type, data: normalized(data.join(' ')) };
  }).filter(r => ['A', 'AAAA', 'CNAME', 'NS'].includes(r.type));
  return { authoritative, status, records };
}
const query = (host, type, server) => {
  if (!safeHost(host) || (server && !safeHost(server))) throw new Error('Invalid DNS host');
  return parseAnswer(execFileSync('dig', [host, type, ...(server ? ['@' + server, '+norecurse'] : []), '+time=4', '+tries=1', '+noall', '+comments', '+answer'], { encoding: 'utf8', timeout: 6000, stdio: ['ignore', 'pipe', 'pipe'] }));
};

// Consult every authoritative server. A successful recursive lookup alone is
// insufficient evidence of authoritative ownership or absence of stale AAAA.
export function verifyDns(host, expectedAddresses, lookup = query) {
  if (!safeHost(host) || !expectedAddresses.length || !expectedAddresses.every(isIP)) throw new Error('Invalid DNS target');
  const ns = lookup(zone, 'NS').records.filter(r => r.type === 'NS').map(r => r.data).sort();
  if (!ns.length) throw new Error('Authoritative nameservers unavailable');
  const authorities = [];
  for (const server of ns) {
    let name = host;
    const seen = new Set();
    const records = [];
    let valid = true;
    while (true) {
      if (seen.has(name) || seen.size > 5 || !(name === zone || name.endsWith('.' + zone))) { valid = false; break; }
      seen.add(name);
      const answers = ['A', 'AAAA', 'CNAME'].map(type => lookup(name, type, server));
      if (answers.some(a => !a.authoritative || a.status !== 'NOERROR')) valid = false;
      const own = answers.flatMap(a => a.records).filter(r => r.name === name);
      records.push(...own.filter((r, i, all) => all.findIndex(x => x.type === r.type && x.data === r.data) === i));
      const aliases = [...new Set(own.filter(r => r.type === 'CNAME').map(r => r.data))];
      if (aliases.length) {
        if (aliases.length !== 1 || own.some(r => ['A', 'AAAA'].includes(r.type))) { valid = false; break; }
        name = aliases[0]; continue;
      }
      const addresses = own.filter(r => ['A', 'AAAA'].includes(r.type)).map(r => r.data);
      if (!addresses.length || addresses.some(address => !expectedAddresses.includes(address))) valid = false;
      break;
    }
    authorities.push({ server, records, valid });
  }
  const publicRecords = ['A', 'AAAA', 'CNAME'].flatMap(type => lookup(host, type).records);
  const publicAddresses = [...new Set(publicRecords.filter(r => ['A', 'AAAA'].includes(r.type)).map(r => r.data))];
  const signatures = authorities.map(a => JSON.stringify(a.records.map(({ name, type, data }) => ({ name, type, data })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))));
  return { host, expectedAddresses, nameservers: ns, authorities, publicAddresses,
    passed: authorities.every(a => a.valid) && new Set(signatures).size === 1 && publicAddresses.length > 0 && publicAddresses.every(a => expectedAddresses.includes(a)) };
}

export async function verifyTls(host) {
  if (!safeHost(host)) throw new Error('Invalid TLS host');
  return new Promise(resolve => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: true });
    socket.setTimeout(10000, () => socket.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate();
      const hostnameValid = !tls.checkServerIdentity(host, cert);
      const notBefore = Date.parse(cert.valid_from), notAfter = Date.parse(cert.valid_to);
      const passed = socket.authorized && hostnameValid && notBefore <= Date.now() && notAfter > Date.now();
      resolve({ host, passed, hostnameValid, issuer: cert.issuer?.O, validFrom: cert.valid_from, validTo: cert.valid_to, fingerprint256: cert.fingerprint256 });
      socket.end();
    });
    socket.once('error', error => resolve({ host, passed: false, error: /^[A-Z_0-9]+$/.test(error.code ?? '') ? error.code : 'TLS_FAILED' }));
  });
}

export function backendForHost(map, host) {
  const rules = (map.hostRules ?? []).filter(r => r.hosts?.includes(host));
  if (rules.length > 1) throw new Error('Conflicting Google host rules');
  if (!rules.length) return map.defaultService;
  const match = map.pathMatchers?.find(m => m.name === rules[0].pathMatcher);
  // Complex rules require explicit review; don't silently assume defaultService.
  if (!match || match.routeRules?.length || match.pathRules?.length || match.defaultUrlRedirect || match.defaultRouteAction) throw new Error('Unverified Google path rules');
  return match.defaultService;
}

export function verifyGoogleRouting(component, hosts, read) {
  const map = read(['compute', 'url-maps', 'describe', 'elevate-public-routes', '--global']);
  const expectedService = `elevate-${component}-migration`;
  const routes = hosts.map(host => {
    const backendURL = backendForHost(map, host);
    if (!backendURL?.match(/\/backendServices\/[a-z0-9-]+$/)) throw new Error('Google backend unavailable');
    const backend = read(['compute', 'backend-services', 'describe', backendURL.split('/').at(-1), '--global']);
    const groups = (backend.backends ?? []).map(b => {
      const parts = /\/regions\/([a-z0-9-]+)\/networkEndpointGroups\/([a-z0-9-]+)$/.exec(b.group ?? '');
      if (!parts) throw new Error('Unverified Google backend group');
      const neg = read(['compute', 'network-endpoint-groups', 'describe', parts[2], '--region=' + parts[1]]);
      return { region: parts[1], name: parts[2], service: neg.cloudRun?.service, networkEndpointType: neg.networkEndpointType };
    });
    return { host, backend: backend.name, groups, passed: groups.length > 0 && groups.every(g => g.service === expectedService && g.region === 'us-central1' && g.networkEndpointType === 'SERVERLESS') };
  });
  const proxies = read(['compute', 'target-https-proxies', 'list']).filter(p => p.urlMap?.endsWith('/elevate-public-routes'));
  const forwarding = read(['compute', 'forwarding-rules', 'list']).filter(f => proxies.some(p => f.target === p.selfLink) && (f.portRange === '443-443' || f.portRange === '443' || f.ports?.includes('443')));
  const addresses = [...new Set(forwarding.map(f => f.IPAddress))].filter(isIP);
  return { routes, addresses, passed: addresses.length > 0 && routes.every(r => r.passed) };
}
