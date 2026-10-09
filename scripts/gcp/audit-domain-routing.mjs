import {execFileSync} from 'node:child_process';
import {loadGoogleConfig} from './runtime-config.mjs';
const report=value=>console.log(JSON.stringify(value));
const domains={marketing:['elevateforhumanity.org','www.elevateforhumanity.org'],admin:['admin.elevateforhumanity.org'],lms:['app.elevateforhumanity.org'],store:['store.elevateforhumanity.org']};
const cli=args=>JSON.parse(execFileSync('gcloud',[...args,'--project=elegant-racer-299721','--format=json'],{encoding:'utf8',timeout:20000,stdio:['ignore','pipe','pipe']}));
let token=process.env.CLOUDFLARE_API_TOKEN,zone=process.env.CLOUDFLARE_ZONE_ID;
for(const component of ['marketing','admin']) {
 try {
  const config=loadGoogleConfig(component).runtimeEnvironment;
  token ||= config.CLOUDFLARE_API_TOKEN;zone ||= config.CLOUDFLARE_ZONE_ID;
  const legacyURLs=Object.entries(config).filter(([key,value])=>!/(secret|token|password|key)/i.test(key)&&/northflank\.(app|com)/i.test(value)).map(([key,value])=>({key,url:value.replace(/([?&#]).*$/,'')}));
  report({component,legacyRuntimeURLs:legacyURLs});
 }catch(error){report({component,runtimeConfigRead:error.code||'unavailable'});}
}
report({dnsCredentials:{tokenPresent:Boolean(token),zonePresent:Boolean(zone)}});
for(const [component,names] of Object.entries(domains)) {
 const service=cli(['run','services','describe','elevate-'+component+'-migration','--region=us-central1']);
 const c=service.spec.template.spec.containers[0];
 report({component,url:service.status.url,revision:service.status.latestReadyRevisionName,traffic:service.status.traffic,image:c.image,startupProbe:c.startupProbe,livenessProbe:c.livenessProbe,storeOnly:(c.env||[]).find(x=>x.name==='STORE_ONLY_RUNTIME')?.value});
 for(const name of names) {
  for(const type of ['CNAME','A','AAAA','NS']) {
   try {
    const response=await fetch('https://dns.google/resolve?name='+encodeURIComponent(name)+'&type='+type,{signal:AbortSignal.timeout(10000)});
    const b=await response.json();report({dns:name,type,status:b.Status,answers:(b.Answer||[]).map(x=>({name:x.name,type:x.type,data:x.data,ttl:x.TTL}))});
   }catch {report({dns:name,type,error:'dns_lookup_failed'});}
  }
  try {
   const r=await fetch('https://'+name+'/api/health',{redirect:'manual',signal:AbortSignal.timeout(30000),cache:'no-store'});
   const body=await r.json().catch(()=>({}));
   report({domain:name,httpStatus:r.status,service:body.service,commit:body.commit,healthy:body.healthy,location:r.headers.get('location'),server:r.headers.get('server')});
  }catch {report({domain:name,error:'public_probe_failed'});}
  if(token && zone) {
   try {
    const r=await fetch('https://api.cloudflare.com/client/v4/zones/'+zone+'/dns_records?name='+encodeURIComponent(name),{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
    const b=await r.json();report({domain:name,dnsApiStatus:r.status,records:(b.result||[]).map(x=>({id:x.id,type:x.type,name:x.name,content:x.content,proxied:x.proxied}))});
   }catch {report({domain:name,dnsApiRead:'unavailable'});}
  }
 }
}
for(const args of [
 ['beta','run','domain-mappings','list','--region=us-central1'],
 ['compute','url-maps','list'],
 ['compute','backend-services','list'],
 ['compute','forwarding-rules','list']
]) {
 try {
  const data=cli(args);
  report({resource:args.slice(0,-1).join(' '),items:data.map(x=>({name:x.name,service:x.spec?.routeName,defaultService:x.defaultService,hostRules:x.hostRules,pathMatchers:x.pathMatchers,backends:x.backends,target:x.target,IPAddress:x.IPAddress,region:x.region,conditions:x.status?.conditions,records:x.status?.resourceRecords}))});
 }catch{report({resource:args.join(' '),read:'unavailable'});}
}
const nfToken=process.env.NORTHFLANK_API_TOKEN;
if(nfToken) {
 try {
  const r=await fetch('https://api.northflank.com/v1/projects/elevate-platform/services',{headers:{Authorization:'Bearer '+nfToken},signal:AbortSignal.timeout(20000)});
  const b=await r.json();const items=Array.isArray(b.data)?b.data:b.data?.services;
  report({northflankStatus:r.status,services:Array.isArray(items)?items.map(x=>({id:x.id,name:x.name,status:x.status,type:x.type,ports:(x.ports||[]).map(p=>({name:p.name,public:p.public,dns:p.dns,domain:p.domain}))})):[]});
 }catch{report({northflankRead:'unavailable'});}
}else report({northflankTokenPresent:false});
