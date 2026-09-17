const API_BASE = 'https://api.northflank.com/v1';
const NF_PROJECT = process.env.NORTHFLANK_PROJECT_ID || 'elevate-platform';
const NF_TOKEN = process.env.NORTHFLANK_API_TOKEN;
const NUMBER = '+13177607908';

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

let apiKey;
for (const id of ['elevate-production-env', 'telnyx-api-key']) {
  try {
    apiKey = findSecret(await nf(`/secrets/${id}`), 'TELNYX_API_KEY');
    if (apiKey) break;
  } catch {}
}
if (!apiKey) throw new Error('TELNYX_API_KEY was not found in Northflank');

const response = await fetch(
  'https://api.telnyx.com/v2/verified_numbers',
  { headers: { Authorization: `Bearer ${apiKey}` } },
);
const json = await response.json();
if (!response.ok) throw new Error(`Telnyx verified-number lookup failed HTTP ${response.status}`);
const entries = Array.isArray(json.data) ? json.data : [];
console.log(
  'VERIFIED NUMBER METADATA:',
  JSON.stringify(
    entries.map((item) => {
      const digits = String(item.phone_number || '').replace(/\D/g, '');
      return {
        last4: digits.slice(-4),
        status: item.status || null,
        verified_at: item.verified_at || null,
        verification_method: item.verification_method || null,
      };
    }),
  ),
);
const targetDigits = NUMBER.replace(/\D/g, '');
const verified = entries.some((item) => {
  const digits = String(item.phone_number || '').replace(/\D/g, '');
  return digits === targetDigits || digits.endsWith(targetDigits.slice(-10));
});
if (!verified) throw new Error(`NOT YET VERIFIED: ${NUMBER}`);
console.log(`VERIFIED DESTINATION: ${NUMBER}`);
