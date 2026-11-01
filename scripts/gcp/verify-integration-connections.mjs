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

const checks = [
  ['website','https://www.elevateforhumanity.org/api/health','marketing'],
  ['admin','https://admin.elevateforhumanity.org/api/health','admin'],
  ['lms','https://lms.elevateforhumanity.org/api/health','lms'],
  ['store','https://store.elevateforhumanity.org/api/health','store'],
  ['quickbooks-website','https://www.elevateforhumanity.org/api/health/quickbooks','quickbooks'],
  ['quickbooks-store','https://store.elevateforhumanity.org/api/health/quickbooks','quickbooks'],
  ['isolated-store-ledger','https://ebnbeqdsuxygopetptlv.supabase.co/functions/v1/quickbooks-payment-receipt','store-commerce-ledger'],
];
const safeReasons=new Set(['oauth_reauthorization_required','oauth_configuration_missing','webhook_verifier_missing','production_environment_unverified','settings_lookup_failed','provider_access_denied','provider_request_failed','provider_timeout','connection_check_failed']);
export async function verifyIntegrationConnections({run=google,request=fetch}={}) {
  const configurations=[];
  for(const component of ['admin','lms','store','ultimate-worker']) {
    try {
      const config=loadGoogleConfig(component,run);
      const environment=config.runtimeEnvironment;
      const evidence=configurationEvidence(environment);
      const resourceName=component==='ultimate-worker'?'elevate-course-builder':`elevate-${component}-migration`;
      const resource=JSON.parse(run(['run',component==='ultimate-worker'?'jobs':'services','describe',resourceName,'--project',PROJECT,'--region','us-central1','--format=json']));
      const containers=component==='ultimate-worker'?resource.spec?.template?.spec?.template?.spec?.containers:resource.spec?.template?.spec?.containers;
      const bound=new Set((containers?.[0]?.env||[]).map(row=>row.name));
      for(const [name,alternatives] of Object.entries(GROUPS)) evidence[name].requiredBindingsPresent=alternatives.some(keys=>keys.every(key=>bound.has(key)));
      configurations.push({component,evidence,note:'Configuration presence is not a provider handshake or a user OAuth grant.'});
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
