import { createHmac } from 'node:crypto';
import { loadGoogleConfig } from './runtime-config.mjs';
import { verifyStripeProvider } from './verify-stripe-provider.mjs';

// Read-only provider check. Never print configuration values, JWTs, or room identities.
const configurations = ['admin', 'lms'].map(component => ({ component, env: loadGoogleConfig(component).runtimeEnvironment }));
let failed = false;
for (const { component, env } of configurations) {
  console.log(JSON.stringify({ component, googleCalendarOAuthConfigured: Boolean((env.GOOGLE_CALENDAR_CLIENT_ID || env.GOOGLE_CLIENT_ID) && (env.GOOGLE_CALENDAR_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET)) }));
  const missing = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'].filter(key => !env[key]);
  if (missing.length) { console.log(JSON.stringify({ component, ready: false, missing })); failed = true; continue; }
  try {
    const url = new URL(env.LIVEKIT_URL);
    if (!['https:', 'wss:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new Error('invalid_endpoint');
    url.protocol = 'https:';
    url.pathname = '/twirp/livekit.RoomService/ListRooms';
    const now = Math.floor(Date.now() / 1000);
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ iss: env.LIVEKIT_API_KEY, sub: 'platform-video-readiness', iat: now, exp: now + 60, video: { roomList: true } });
    const token = unsigned + '.' + createHmac('sha256', env.LIVEKIT_API_SECRET).update(unsigned).digest('base64url');
    const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(15000), redirect: 'error' });
    const body = await response.json().catch(() => null);
    const ready = response.ok && body !== null && (body.rooms === undefined || Array.isArray(body.rooms));
    console.log(JSON.stringify({ component, providerAuthenticated: ready, httpStatus: response.status }));
    if (!ready) failed = true;
  } catch { console.log(JSON.stringify({ component, providerAuthenticated: false, error: 'Provider endpoint could not be validated or reached' })); failed = true; }
}
const matching = ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'].every(key => configurations[0].env[key] && configurations[0].env[key] === configurations[1].env[key]);
console.log(JSON.stringify({ sharedProviderConfiguration: matching, browserMediaAcceptance: 'requires two real devices' }));
const calendarCredentials = configurations.map(({ env }) => [env.GOOGLE_CALENDAR_CLIENT_ID || env.GOOGLE_CLIENT_ID, env.GOOGLE_CALENDAR_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET]);
console.log(JSON.stringify({ sharedGoogleCalendarOAuthConfiguration: calendarCredentials[0].every((value, index) => Boolean(value) && value === calendarCredentials[1][index]) }));
const paymentConfigurations=[...configurations,{component:'marketing',env:loadGoogleConfig('marketing').runtimeEnvironment}];
for(const stripe of await Promise.all(paymentConfigurations.map(config=>verifyStripeProvider(config)))) {
  console.log(JSON.stringify({provider:'stripe',...stripe,configurationChanged:false,transactionsCreated:0}));
  if(!stripe.ready)failed=true;
}
if (!matching || failed) process.exitCode = 1;
