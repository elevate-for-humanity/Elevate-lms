import {loadGoogleConfig} from '../../scripts/gcp/runtime-config.mjs';
const NUMBER = '+13177607908';
const apiKey=loadGoogleConfig('admin').runtimeEnvironment.TELNYX_API_KEY;
if(!apiKey)throw new Error('TELNYX_API_KEY is missing from Google-owned Admin configuration');

const response = await fetch('https://api.telnyx.com/v2/verified_numbers', {
  headers: { Authorization: `Bearer ${apiKey}` },
});
const json = await response.json();
if (!response.ok) throw new Error(`Telnyx verified-number lookup failed HTTP ${response.status}`);
const entries = Array.isArray(json.data) ? json.data : [];
console.info(
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
console.info(`VERIFIED DESTINATION: ${NUMBER}`);
