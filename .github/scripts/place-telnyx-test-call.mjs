import {loadGoogleConfig} from '../../scripts/gcp/runtime-config.mjs';
const FROM = '+13179999620';
const TO = '+13177607908';
const CONNECTION_ID = '3051039365166794471';
const SYSTEM_ID = '341f59a3-b1d6-4360-8463-0ce0402f86fe';
const WEBHOOK = 'https://admin.elevateforhumanity.org/api/webhooks/telnyx';
const apiKey=loadGoogleConfig('admin').runtimeEnvironment.TELNYX_API_KEY;
if(!apiKey)throw new Error('TELNYX_API_KEY is missing from Google-owned Admin configuration');
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
