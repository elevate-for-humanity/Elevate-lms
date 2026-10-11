import {execFileSync} from 'node:child_process';
import {loadGoogleConfig} from './runtime-config.mjs';
const report=value=>console.log(JSON.stringify(value));
const domains={marketing:['elevateforhumanity.org','www.elevateforhumanity.org'],admin:['admin.elevateforhumanity.org','dev-studio.elevateforhumanity.org'],lms:['app.elevateforhumanity.org','lms.elevateforhumanity.org','portal.elevateforhumanity.org','dashboard.elevateforhumanity.org'],store:['store.elevateforhumanity.org'],testing:['testing.elevateforhumanity.org']};
const cli=args=>JSON.parse(execFileSync('gcloud',[...args,'--project=elegant-racer-299721','--format=json'],{encoding:'utf8',timeout:20000,stdio:['ignore','pipe','pipe']}));
let token=process.env.CLOUDFLARE_API_TOKEN,zone=process.env.CLOUDFLARE_ZONE_ID;
for(const component of ['marketing','admin','lms','store','studio-browser','ultimate-worker']) {
 try {
  const config=loadGoogleConfig(component).runtimeEnvironment;
  token ||= config.CLOUDFLARE_API_TOKEN;zone ||= config.CLOUDFLARE_ZONE_ID;
  const legacyURLs=Object.entries(config).filter(([key,value])=>!/(secret|token|password|key)/i.test(key)&&/northflank\.(app|com)/i.test(value)).map(([key,value])=>({key,url:value.replace(/([?&#]).*$/,'')}));
  report({component,legacyRuntimeURLs:legacyURLs});
 }catch(error){report({component,runtimeConfigRead:error.code||'unavailable'});}
}
report({dnsCredentials:{tokenPresent:Boolean(token),zonePresent:Boolean(zone)}});
for(const [component,names] of Object.entries(domains)) {
 const service=cli(['run','services','describe','elevate-'+(component==='testing'?'marketing':component)+'-migration','--region=us-central1']);
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
 ['compute','forwarding-rules','list'],
 ['compute','target-https-proxies','list'],
 ['compute','ssl-certificates','list'],
 ['certificate-manager','maps','list'],
 ['run','services','list','--region=us-central1'],
 ['run','jobs','list','--region=us-central1']
]) {
 try {
  const data=cli(args);
  report({resource:args.slice(0,-1).join(' '),items:data.map(x=>({name:x.name,service:x.spec?.routeName,defaultService:x.defaultService,hostRules:x.hostRules,pathMatchers:x.pathMatchers,backends:x.backends,target:x.target,IPAddress:x.IPAddress,region:x.region,conditions:x.status?.conditions,records:x.status?.resourceRecords,sslCertificates:x.sslCertificates,certificateMap:x.certificateMap,managed:x.managed,cloudRun:x.cloudRun,labels:x.metadata?.labels,url:x.status?.url}))});
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

for (const name of ['store','portal','dashboard','testing','dev-studio'].map(x=>x+'.elevateforhumanity.org')) {
 try {
  const result=execFileSync('curl',['--silent','--show-error','--connect-timeout','10','--max-time','25','--resolve',name+':443:34.110.235.233','--write-out','\\nHTTP_STATUS:%{http_code}','https://'+name+'/api/health'],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe']});
  const marker=result.lastIndexOf('HTTP_STATUS:');
  if(marker<0)throw Error('curl status marker missing');
  const body=result.slice(0,marker);let health={};try{health=JSON.parse(body);}catch{}
  report({googleEdgeTLS:name,verified:true,httpStatus:Number(result.slice(marker+'HTTP_STATUS:'.length).trim()),service:health.service,healthy:health.healthy,commit:health.commit});
 } catch(error){report({googleEdgeTLS:name,verified:false,exitCode:error.status,reason:String(error.stderr||'').replace(/\\n/g,' ').slice(0,350)});}
}
for(const args of [['compute','instances','list'],['compute','disks','list']]){
 try{report({resource:args.join(' '),items:cli(args).map(x=>({name:x.name,status:x.status,zone:x.zone,disks:x.disks?.map(d=>({source:d.source,boot:d.boot,autoDelete:d.autoDelete})),users:x.users}))});}catch{report({resource:args.join(' '),read:'unavailable'});}
}
if(nfToken) for(const id of ['elevate-lms','elevate-admin','elevate-marketing','elevate-store','elevate-studio-browser','elevate-ultimate-worker']){
 try{const response=await fetch('https://api.northflank.com/v1/projects/elevate-platform/services/'+id+'/ports',{headers:{Authorization:'Bearer '+nfToken},signal:AbortSignal.timeout(15000)});const b=await response.json();report({legacyPortService:id,status:response.status,ports:(b.data?.ports||b.ports||[]).map(p=>({name:p.name,dns:p.dns,domains:p.domains}))});}catch{report({legacyPortService:id,read:'unavailable'});}
}
