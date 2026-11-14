import {pathToFileURL} from 'node:url';
import {google,PROJECT,loadGoogleConfig} from './runtime-config.mjs';

export const oauthName = /google|gcal|calendar|oauth/i;
const idFormat = /[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com/;
const secretFormat = /GOCSPX-[A-Za-z0-9_-]+/;
const safe = value => typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_.:/-]{0,254}$/.test(value) && !idFormat.test(value) && !secretFormat.test(value) ? value : '[field]';
const category = error => ['permission_denied','not_found','authentication_failed','api_disabled','quota_exceeded'].includes(error?.code) ? error.code : 'unavailable';

/** Return names and booleans only, including credentials embedded in saved JSON or env files. */
export function scanCredentialLocations(value, path = 'config', depth = 0, rows = []) {
  if (depth > 24 || rows.length >= 200) return rows;
  if (typeof value === 'string') {
    const hasId = idFormat.test(value), hasSecret = secretFormat.test(value);
    if ((/client.?secret|client.?id/i.test(path) || (oauthName.test(path) && /client|secret|credential|oauth|enabled/i.test(path))) || hasId || hasSecret)
      rows.push({path,nonEmpty:Boolean(value.trim()),googleClientIdFormat:hasId,googleClientSecretFormat:hasSecret});
    if (value.length < 1000000 && /^[\s]*[\[{]/.test(value)) {
      try {scanCredentialLocations(JSON.parse(value),path+'.json',depth+1,rows);} catch {}
    }
    if (value.includes('\n')) for (const line of value.split('\n')) {
      const match=line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*(?:GOOGLE|GCAL)[A-Z0-9_]*|GOOGLE[A-Z0-9_]*|GCAL[A-Z0-9_]*)\s*=\s*(.*)$/);
      if (match) scanCredentialLocations(match[2],path+'.env.'+safe(match[1]),depth+1,rows);
    }
    return rows;
  }
  if (Array.isArray(value)) value.forEach((child,index)=>scanCredentialLocations(child,path+'.'+index,depth+1,rows));
  else if (value && typeof value === 'object')
    for (const [key,child] of Object.entries(value)) scanCredentialLocations(child,path+'.'+safe(key),depth+1,rows);
  return rows;
}

export function auditGoogleOAuthLocations({run=google, report=value=>console.log(JSON.stringify(value)), actionEnv=process.env}={}) {
  report({audit:'google-oauth-hidden-locations-v1',readOnly:true,valuesExposed:false,project:PROJECT});
  for (const key of Object.keys(actionEnv).filter(key=>key.startsWith('AUDIT_OAUTH_'))) {
    report({source:'github-actions-production',key:safe(key.slice(12)),present:Boolean(actionEnv[key]?.trim())});
  }
  for (const component of ['admin','lms','marketing','store','ultimate-worker','studio-browser']) {
    try {
      const config=loadGoogleConfig(component,run);
      report({source:'google-runtime-config',component,locations:scanCredentialLocations(config),scanLimit:200});
    } catch(error) {report({source:'google-runtime-config',component,readError:category(error)});}
  }
  const flags=['--project',PROJECT,'--region','us-central1','--format=json'];
  for (const component of ['admin','lms','marketing','store']) {
    try {
      const service=JSON.parse(run(['run','services','describe','elevate-'+component+'-migration',...flags]));
      const serving=(service.status?.traffic||[]).filter(row=>row.percent>0);
      if (!serving.length) throw Error('unverified_traffic');
      for (const traffic of serving) {
        const revision=traffic.revisionName||(traffic.latestRevision?service.status.latestReadyRevisionName:null);
        if (typeof revision!=='string'||!/^elevate-[a-z0-9-]+$/.test(revision)) throw Error('unverified_revision');
        const actual=JSON.parse(run(['run','revisions','describe',revision,...flags]));
        const env=(actual.spec?.containers||[]).flatMap(container=>container.env||[]);
        report({source:'serving-revision',component,revision,trafficPercent:traffic.percent,
          providerSwitch:env.some(row=>row.name==='ELEVATE_RUNTIME_CONFIG_PROVIDER'&&row.value==='google-secret-manager'),
          oauthBindings:env.filter(row=>oauthName.test(row.name||'')).map(row=>({key:safe(row.name),
            literalPresent:typeof row.value==='string'&&Boolean(row.value.trim()),
            secretReference:row.valueFrom?.secretKeyRef?safe(row.valueFrom.secretKeyRef.name):null,
            secretVersion:row.valueFrom?.secretKeyRef?safe('v'+row.valueFrom.secretKeyRef.key):null})),
          embeddedLocations:scanCredentialLocations(Object.fromEntries(env.filter(row=>typeof row.value==='string').map(row=>[row.name,row.value])),'environment')});
        for (const row of env.filter(row=>oauthName.test(row.name||'')&&row.valueFrom?.secretKeyRef)) {
          const ref=row.valueFrom.secretKeyRef;
          try {
            const payload=run(['secrets','versions','access',ref.key||'latest','--secret',ref.name,'--project',PROJECT]);
            report({source:'serving-secret-payload',component,key:safe(row.name),locations:scanCredentialLocations(payload,'binding.'+safe(row.name))});
          } catch(error) {report({source:'serving-secret-payload',component,key:safe(row.name),readError:category(error)});}
        }
      }
    } catch(error) {report({source:'serving-revision',component,readError:category(error)});}
  }
  try {
    const names=JSON.parse(run(['secrets','list','--project',PROJECT,'--format=json(name)'])).map(row=>row.name.split('/').at(-1));
    const candidates=names.filter(name=>oauthName.test(name)||/elevate-source-|secret-group/i.test(name));
    report({source:'secret-manager-inventory',candidateNames:candidates.map(safe),candidateCount:candidates.length});
    for (const name of candidates) {
      try {
        const versions=JSON.parse(run(['secrets','versions','list',name,'--project',PROJECT,'--format=json(name,state)']));
        report({source:'secret-versions',secret:safe(name),versions:versions.map(row=>({version:row.name.split('/').at(-1),state:row.state}))});
        const enabled=versions.filter(row=>row.state==='ENABLED').sort((a,b)=>Number(b.name.split('/').at(-1))-Number(a.name.split('/').at(-1)));
        report({source:'secret-scan-coverage',secret:safe(name),enabledVersions:enabled.length,versionsToRead:Math.min(enabled.length,5)});
        for (const version of enabled.slice(0,5)) {
          const number=version.name.split('/').at(-1);
          try {
            const payload=run(['secrets','versions','access',number,'--secret',name,'--project',PROJECT]);
            let value=payload;try {value=JSON.parse(payload);} catch {}
            report({source:'secret-payload-scan',secret:safe(name),version:number,locations:scanCredentialLocations(value,'secret.'+safe(name))});
          } catch(error) {report({source:'secret-payload-scan',secret:safe(name),version:number,readError:category(error)});}
        }
      } catch(error) {report({source:'secret-versions',secret:safe(name),readError:category(error)});}
    }
  } catch(error) {report({source:'secret-manager-inventory',readError:category(error)});}
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) auditGoogleOAuthLocations();
