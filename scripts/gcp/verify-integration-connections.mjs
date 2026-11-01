import { createHmac } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { google, loadGoogleConfig, PROJECT } from './runtime-config.mjs';

const GROUPS = {
  calendar: [['GOOGLE_CALENDAR_CLIENT_ID','GOOGLE_CALENDAR_CLIENT_SECRET'],['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET']],
  meetings: [['LIVEKIT_URL','LIVEKIT_API_KEY','LIVEKIT_API_SECRET']],
  sms: [['TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN']],
  email: [['RESEND_API_KEY']],
  media: [['ELEVATE_MEDIA_ENDPOINT','ELEVATE_MEDIA_BUCKET','ELEVATE_MEDIA_ACCESS_KEY_ID','ELEVATE_MEDIA_SECRET_ACCESS_KEY']],
};
export function configurationEvidence(environment) {
  return Object.fromEntries(Object.entries(GROUPS).map(([name,alternatives])=>[name,{
    configuredInGoogleSnapshot: (name === 'calendar' && (environment.GOOGLE_CALENDAR_CLIENT_ID || environment.GOOGLE_CALENDAR_CLIENT_SECRET)
      ? [alternatives[0]] : alternatives).some(keys=>keys.every(key=>Boolean(environment[key]?.trim()))),
  }]));
}

/** Read-only provider authentication; no rooms, participants or messages are created. */
export async function verifyMeetingProvider(environment, request = fetch) {
  const { LIVEKIT_URL: root, LIVEKIT_API_KEY: key, LIVEKIT_API_SECRET: secret } = environment;
  if (!root || !key || !secret) return { configured: false, authenticated: false };
  try {
    const url = new URL(root);
    if (!['https:', 'wss:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw Error('invalid endpoint');
    if (!['livekit.cloud', 'elevateforhumanity.org'].some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain))) return { configured: true, authenticated: false, reason: 'endpoint_requires_review' };
    url.protocol = 'https:';
    const now = Math.floor(Date.now() / 1000);
    const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = encode({alg:'HS256',typ:'JWT'}) + '.' + encode({iss:key,iat:now,nbf:now-5,exp:now+60,video:{roomList:true}});
    const jwt = unsigned + '.' + createHmac('sha256', secret).update(unsigned).digest('base64url');
    const response = await request(url.origin + '/twirp/livekit.RoomService/ListRooms', {
      method:'POST',headers:{Authorization:'Bearer ' + jwt,'Content-Type':'application/json'},body:'{}',
      redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
    });
    const body = await response.json().catch(() => null);
    const authenticated = response.ok && body !== null && typeof body === 'object' && (body.rooms === undefined || Array.isArray(body.rooms));
    return {configured:true,authenticated,status:response.status,mediaDeliveryCertified:false};
  } catch { return {configured:true,authenticated:false,reason:'provider_probe_failed'}; }
}

export async function verifyQuickBooksCredentialSources(environment, request=fetch) {
  const key=environment.SUPABASE_SERVICE_ROLE_KEY;
  const source=(environment.SUPABASE_URL||environment.NEXT_PUBLIC_SUPABASE_URL||'').replace(/\/$/,'');
  if(source!=='https://cuxzzpsyufcewtmicszk.supabase.co'||!key) return {verified:false,reason:'source_configuration_unavailable'};
  try {
    const keys=['QB_CLIENT_ID','QB_CLIENT_SECRET','QB_REDIRECT_URI','QB_ACCESS_TOKEN','QB_REFRESH_TOKEN','QB_REALM_ID'];
    const response=await request(source+'/rest/v1/app_settings?select=key,value,updated_at&key=in.('+keys.join(',')+')',{
      headers:{apikey:key,Authorization:'Bearer '+key},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(15000),
    });
    const rows=await response.json();if(!response.ok||!Array.isArray(rows))throw Error('settings unavailable');
    const stored=Object.fromEntries(rows.map(row=>[row.key,row.value]));
    return {verified:true,staticCredentialAgreement:Object.fromEntries(['QB_CLIENT_ID','QB_CLIENT_SECRET','QB_REDIRECT_URI'].map(name=>[name,{
      runtimePresent:Boolean(environment[name]),storedPresent:Boolean(stored[name]),match:Boolean(environment[name]&&stored[name]&&environment[name]===stored[name]),
    }])),savedTokens:rows.filter(row=>['QB_ACCESS_TOKEN','QB_REFRESH_TOKEN'].includes(row.key)).map(row=>({key:row.key,present:Boolean(row.value),updatedAt:row.updated_at})),productionConfigured:environment.QB_ENVIRONMENT==='production'};
  }catch{return {verified:false,reason:'settings_probe_failed'};}
}

const checks = [
  ['website','https://www.elevateforhumanity.org/api/health','marketing'],
  ['admin','https://admin.elevateforhumanity.org/api/health','admin'],
  ['lms','https://lms.elevateforhumanity.org/api/health','lms'],
  ['store','https://store.elevateforhumanity.org/api/health','store'],
  ['quickbooks-website','https://www.elevateforhumanity.org/api/health/quickbooks','quickbooks'],
  ['quickbooks-store','https://store.elevateforhumanity.org/api/health/quickbooks','quickbooks'],
  ['isolated-store-ledger','https://ebnbeqdsuxygopetptlv.supabase.co/functions/v1/quickbooks-payment-receipt','store-commerce-ledger'],
];
const safeReasons=new Set(['oauth_client_rejected','provider_rate_limited','provider_unavailable','oauth_refresh_failed','oauth_reauthorization_required','oauth_configuration_missing','webhook_verifier_missing','production_environment_unverified','settings_lookup_failed','provider_access_denied','provider_request_failed','provider_timeout','connection_check_failed']);
export async function verifyIntegrationConnections({run=google,request=fetch}={}) {
  const configurations=[];
  for(const component of ['marketing','admin','lms','store','ultimate-worker']) {
    try {
      const config=loadGoogleConfig(component,run);
      const environment=config.runtimeEnvironment;
      const evidence=configurationEvidence(environment);
      const resourceName=component==='ultimate-worker'?'elevate-course-builder':`elevate-${component}-migration`;
      const resource=JSON.parse(run(['run',component==='ultimate-worker'?'jobs':'services','describe',resourceName,'--project',PROJECT,'--region','us-central1','--format=json']));
      let containers;
      if(component==='ultimate-worker') containers=resource.spec?.template?.spec?.template?.spec?.containers;
      else {
        const traffic=(resource.status?.traffic||[]).filter(row=>row.percent>0);
        if(traffic.length!==1 || traffic[0].percent!==100) throw Error('ambiguous serving revision');
        const revision=traffic[0].revisionName||(traffic[0].latestRevision?resource.status?.latestReadyRevisionName:null);
        if(typeof revision!=='string'||!/^elevate-[a-z0-9-]+$/.test(revision)) throw Error('invalid serving revision');
        const serving=JSON.parse(run(['run','revisions','describe',revision,'--project',PROJECT,'--region','us-central1','--format=json']));
        containers=serving.spec?.containers;
      }
      const bindings=containers?.[0]?.env||[];
      const bound=new Set(bindings.map(row=>row.name));
      for(const [name,alternatives] of Object.entries(GROUPS)) evidence[name].requiredBindingsPresent=alternatives.some(keys=>keys.every(key=>bound.has(key)));
      const providerEnvironment={};
      for(const row of bindings.filter(row=>['LIVEKIT_URL','LIVEKIT_API_KEY','LIVEKIT_API_SECRET','QB_CLIENT_ID','QB_CLIENT_SECRET','QB_REDIRECT_URI','QB_ENVIRONMENT','SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY'].includes(row.name))) {
        const ref=row.valueFrom?.secretKeyRef;
        providerEnvironment[row.name]=typeof row.value==='string'?row.value:ref?run(['secrets','versions','access',ref.key||'latest','--secret',ref.name,'--project',PROJECT]):'';
      }
      const meetingProvider = await verifyMeetingProvider(providerEnvironment, request);
      const quickBooksSources = component==='ultimate-worker'?undefined:await verifyQuickBooksCredentialSources(providerEnvironment,request);
      configurations.push({component,evidence,meetingProvider,quickBooksSources,note:'Configuration presence is not a provider handshake or a user OAuth grant.'});
    } catch(error) {
      configurations.push({component,inventoryUnavailable:true,reason:['permission_denied','not_found','authentication_failed'].includes(error?.code)?error.code:'inventory_unavailable'});
    }
  }
  const probes=await Promise.all(checks.map(async([name,url,expected])=>{
    try {
      const response=await request(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(25000)});
      const body=await response.json();
      let passed=response.status===200&&body.service===expected;
      if(expected==='quickbooks')passed&&=body.connected===true&&body.ready===true;
      else if(expected==='store-commerce-ledger')passed&&=body.ready===true&&body.databaseProject==='ebnbeqdsuxygopetptlv';
      else passed&&=body.healthy===true&&body.dependencies?.supabase?.ok===true;
      return {name,status:response.status,passed,commit:/^[a-f0-9]{40}$/.test(body.commit||'')?body.commit:undefined,
        reason:safeReasons.has(body.reason)?body.reason:undefined};
    }catch{return {name,passed:false,reason:'probe_unavailable'};}
  }));
  return {source:process.env.GITHUB_SHA||null,configurations,probes,publicConnectionsPassed:probes.every(p=>p.passed),
    endToEndCertified:false,note:'User calendar consent, real device media and provider delivery receipts need their own acceptance evidence.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const report=await verifyIntegrationConnections();
  writeFileSync('integration-connections.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(!report.publicConnectionsPassed||report.configurations.some(c=>c.inventoryUnavailable))process.exitCode=1;
}
