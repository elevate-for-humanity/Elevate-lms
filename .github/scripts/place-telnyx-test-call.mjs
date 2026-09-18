const API_BASE = 'https://api.northflank.com/v1';
const NF_PROJECT = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const NF_TOKEN = process.env.NORTHFLANK_API_TOKEN;
const FROM = '+13179999620';
const TO = '+13177607908';
const CONNECTION_ID = '3051039365166794471';
const SYSTEM_ID = '341f59a3-b1d6-4360-8463-0ce0402f86fe';
const WEBHOOK = 'https://admin.elevateforhumanity.org/api/webhooks/telnyx';

if (!NF_TOKEN) throw new Error('NORTHFLANK_API_TOKEN is required');

async function nf(path) {
  const response = await fetch(`${API_BASE}/projects/${NF_PROJECT}${path}`, {
    headers: { Authorization: `Bearer ${NF_TOKEN}` },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`Northflank HTTP ${response.status}`);
  return json.data ?? json;
}

function findSecret(root, key) {
  const seen = new Set();
  const walk = (value) => {
    if (!value || typeof value !== 'object' || seen.has(value)) return undefined;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        if (
          item && typeof item === 'object' &&
          String(item.key ?? item.name ?? '') === key &&
          typeof (item.value ?? item.secret) === 'string'
        ) return String(item.value ?? item.secret);
        const found = walk(item);
        if (found) return found;
      }
      return undefined;
    }
    if (typeof value[key] === 'string') return value[key];
    for (const nested of Object.values(value)) {
      const found = walk(nested);
      if (found) return found;
    }
  };
  return walk(root);
}

async function getTelnyxKey() {
  for (const id of ['elevate-production-env', 'telnyx-api-key']) {
    try {
      const group = await nf(`/secrets/${id}`);
      const key = findSecret(group, 'TELNYX_API_KEY');
      if (key) return key;
    } catch {
      // Continue to the next known Northflank secret group.
    }
  }
  const listing = await nf('/secrets');
  const groups = Array.isArray(listing)
    ? listing
    : listing?.secrets || listing?.items || listing?.results || [];
  for (const summary of groups) {
    const id = String(summary?.id || summary?.name || '').trim();
    if (!id) continue;
    try {
      const key = findSecret(await nf(`/secrets/${id}`), 'TELNYX_API_KEY');
      if (key) return key;
    } catch {
      // Ignore inaccessible groups and continue searching the account inventory.
    }
  }
  throw new Error('TELNYX_API_KEY was not found in Northflank');
}

const apiKey = await getTelnyxKey();
const clientState = Buffer.from(
  JSON.stringify({ systemId: SYSTEM_ID, phase: 'authorized_test_call' }),
  'utf8',
).toString('base64');

const response = await fetch('https://api.telnyx.com/v2/calls', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    connection_id: CONNECTION_ID,
    from: FROM,
    to: TO,
    webhook_url: WEBHOOK,
    webhook_url_method: 'POST',
    client_state: clientState,
    command_id: `elevate-test-${Date.now()}`,
    timeout_secs: 45,
    answering_machine_detection: 'disabled',
  }),
});
const json = await response.json();
if (!response.ok) {
  const detail = json.errors?.map((error) => error.title || error.detail).join('; ');
  throw new Error(`Telnyx test call failed HTTP ${response.status}: ${detail || 'request failed'}`);
}
console.info(
  `TEST CALL ACCEPTED: ${FROM} -> ${TO}; call_control_id=${json.data?.call_control_id || 'accepted'}`,
);
