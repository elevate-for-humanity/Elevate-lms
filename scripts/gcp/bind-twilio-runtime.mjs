import { pathToFileURL } from 'node:url';
import { loadGoogleConfig, validateConfig, google, PROJECT } from './runtime-config.mjs';

const ACCOUNT = 'AC75bcca01e19767614252902185ed948f';
const NUMBER = '+14632401404';
const PHONE_SID = 'PN98930da7084d809ab410e1ece0115632';

export function mergeTwilioBindings(config, bindings) {
  const next = structuredClone(config);
  for (const [key, value] of Object.entries(bindings)) {
    if (key !== 'TWILIO_PHONE_NUMBER' && next.runtimeEnvironment[key] && next.runtimeEnvironment[key] !== value)
      throw Error('Existing Twilio credential binding requires review');
    next.runtimeEnvironment[key] = value;
  }
  return validateConfig(next, config.component);
}

export async function verifiedTwilioBindings(config, fetchImpl = fetch) {
  const env = config.runtimeEnvironment;
  const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (base !== 'https://cuxzzpsyufcewtmicszk.supabase.co' || !key)
    throw Error('Canonical credential store bootstrap is unavailable');
  const values = {};
  for (const name of ['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN']) {
    const response = await fetchImpl(base + '/rest/v1/rpc/get_platform_secret', {
      method:'POST', headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({p_key:name}), redirect:'error', signal:AbortSignal.timeout(15000),
    });
    if (!response.ok) throw Error('Canonical Twilio credential access failed');
    const value = await response.json();
    if (typeof value !== 'string' || !value.trim()) throw Error('Required Twilio credential is not configured');
    values[name] = value.trim();
  }
  if (values.TWILIO_ACCOUNT_SID !== ACCOUNT || !/^[a-f0-9]{32}$/i.test(values.TWILIO_AUTH_TOKEN))
    throw Error('Twilio account or credential format does not match the approved account');
  // Verify ownership without sending messages, dialing, or printing credentials.
  const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT}/IncomingPhoneNumbers/${PHONE_SID}.json`, {
    headers:{Authorization:'Basic '+Buffer.from(`${ACCOUNT}:${values.TWILIO_AUTH_TOKEN}`).toString('base64')},
    redirect:'error',signal:AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error('Twilio authentication or number verification failed');
  const number = await response.json();
  if (number.account_sid !== ACCOUNT || number.sid !== PHONE_SID || number.phone_number !== NUMBER)
    throw Error('The Twilio number does not belong to the approved account');
  return {...values,TWILIO_PHONE_NUMBER:NUMBER};
}

export async function bindRuntime(run = google, fetchImpl = fetch) {
  const source = loadGoogleConfig('admin', run);
  const bindings = await verifiedTwilioBindings(source, fetchImpl);
  const evidence = [];
  for (const component of ['admin','lms']) {
    const secret = `elevate-${component}-runtime-config`;
    const describe = () => run(['secrets','versions','describe','latest','--secret',secret,'--project',PROJECT,'--format=value(name)']);
    const before = describe();
    const current = loadGoogleConfig(component, run);
    if (describe() !== before) throw Error('Runtime configuration changed during binding; retry with the latest version');
    const next = mergeTwilioBindings(current, bindings);
    let version = before;
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      if (describe() !== before) throw Error('Runtime configuration changed before binding; retry with the latest version');
      version = run(['secrets','versions','add',secret,'--project',PROJECT,'--data-file=-','--format=value(name)'],JSON.stringify(next));
    }
    evidence.push({component,version,accountConfigured:true,webhookAuthenticationConfigured:true,businessNumberConfigured:true});
  }
  console.log(JSON.stringify({result:'PASS',twilioRuntimeBindings:evidence,numberOwnershipVerified:true,messagesSent:0,callsPlaced:0}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  bindRuntime().catch(() => {
    console.error('Twilio runtime binding blocked; no credential values were emitted.');
    process.exitCode = 1;
  });
}
