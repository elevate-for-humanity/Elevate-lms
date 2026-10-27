import {loadGoogleConfig} from '../../scripts/gcp/runtime-config.mjs';
const NUMBER = '+13177607908';
const apiKey=loadGoogleConfig('admin').runtimeEnvironment.TELNYX_API_KEY;
if(!apiKey)throw new Error('TELNYX_API_KEY is missing from Google-owned Admin configuration');

const existing = await fetch(
  `https://api.telnyx.com/v2/verified_numbers?filter[phone_number]=${encodeURIComponent(NUMBER)}`,
  { headers: { Authorization: `Bearer ${apiKey}` } },
);
if (existing.ok) {
  const json = await existing.json();
  if (Array.isArray(json.data) && json.data.some((item) => item.phone_number === NUMBER)) {
    console.info(`ALREADY VERIFIED: ${NUMBER}`);
    process.exit(0);
  }
}

const response = await fetch('https://api.telnyx.com/v2/verified_numbers', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone_number: NUMBER,
    verification_method: 'dtmf',
  }),
});
const json = await response.json();
if (!response.ok) {
  const detail = json.errors?.map((error) => error.title || error.detail).join('; ');
  throw new Error(
    `Telnyx verification request failed HTTP ${response.status}: ${detail || 'request failed'}`,
  );
}
console.info(`VERIFICATION CALL REQUESTED: ${NUMBER}; id=${json.data?.id || 'accepted'}`);
