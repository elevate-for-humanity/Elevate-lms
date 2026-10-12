import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const project='elegant-racer-299721', mapName='elevate-public-http-redirect', proxyName='elevate-public-http-proxy', ruleName='elevate-public-http-forwarding';
const read=args=>JSON.parse(execFileSync('gcloud',[...args,'--project='+project,'--format=json'],{encoding:'utf8',timeout:30000}));
const mutate=args=>execFileSync('gcloud',[...args,'--project='+project,'--quiet'],{stdio:'inherit',timeout:120000});
export function hasPort(rule,port) {
 if((rule.ports||[]).some(x=>String(x)===String(port))) return true;
 const [start,end=start]=String(rule.portRange||'').split('-').map(Number);return start<=port&&end>=port;
}
export function redirectMap() {
 const redirect={httpsRedirect:true,redirectResponseCode:'MOVED_PERMANENTLY_DEFAULT',stripQuery:false};
 return {name:mapName,description:'Elevate HTTP redirect on the existing public IP.',defaultUrlRedirect:redirect,
 hostRules:[{hosts:['elevateforhumanity.org','www.elevateforhumanity.org'],pathMatcher:'marketing-canonical'}],
 pathMatchers:[{name:'marketing-canonical',defaultUrlRedirect:{...redirect,hostRedirect:'www.elevateforhumanity.org'}}],
 tests:[
 {host:'elevateforhumanity.org',path:'/programs/barber-apprenticeship?source=entry',expectedOutputUrl:'https://www.elevateforhumanity.org/programs/barber-apprenticeship?source=entry',expectedRedirectResponseCode:301},
 {host:'www.elevateforhumanity.org',path:'/',expectedOutputUrl:'https://www.elevateforhumanity.org/',expectedRedirectResponseCode:301},
 {host:'app.elevateforhumanity.org',path:'/login?redirect=%2Flms',expectedOutputUrl:'https://app.elevateforhumanity.org/login?redirect=%2Flms',expectedRedirectResponseCode:301}]};
}
export function selectFrontend(map,proxies,rules,addresses) {
 assert.equal(map.name,'elevate-public-routes');
 const active=proxies.filter(p=>p.urlMap===map.selfLink);
 const matching=rules.filter(r=>active.some(p=>p.selfLink===r.target)&&hasPort(r,443)&&/^\d+\.\d+\.\d+\.\d+$/.test(r.IPAddress||''));
 const ips=[...new Set(matching.map(r=>r.IPAddress))];assert.equal(ips.length,1,'Require one established IPv4 HTTPS frontend');
 const address=addresses.find(a=>a.address===ips[0]);assert.ok(address,'Reuse an existing reserved address');
 const schemes=[...new Set(matching.map(r=>r.loadBalancingScheme))];assert.equal(schemes.length,1);assert.ok(['EXTERNAL','EXTERNAL_MANAGED'].includes(schemes[0]));
 return {ip:ips[0],addressName:address.name,scheme:schemes[0]};
}
async function repair() {
 const map=read(['compute','url-maps','describe','elevate-public-routes','--global']);
 const rules=read(['compute','forwarding-rules','list','--global']);
 const frontend=selectFrontend(map,read(['compute','target-https-proxies','list']),rules,read(['compute','addresses','list','--global']));
 const occupied=rules.filter(r=>r.IPAddress===frontend.ip&&hasPort(r,80));
 console.log(JSON.stringify({discovery:frontend,httpRules:occupied.map(r=>({name:r.name,target:r.target}))}));
 const dns=await fetch('https://dns.google/resolve?name=www.elevateforhumanity.org&type=A',{signal:AbortSignal.timeout(15000)});
 assert.ok(dns.ok);assert.ok(((await dns.json()).Answer||[]).some(a=>a.type===1&&a.data===frontend.ip),'Public www DNS must use the established Google frontend');
 const version=await fetch('https://www.elevateforhumanity.org/api/version',{signal:AbortSignal.timeout(15000),cache:'no-store'});
 assert.equal(version.status,200,'Verify the TLS-protected public site before changing its HTTP entry');
 assert.equal((await version.json()).service,'marketing','Require the existing public Marketing runtime');
 assert.ok(occupied.every(r=>r.name===ruleName&&r.target.endsWith('/targetHttpProxies/'+proxyName)),'Do not replace an unrelated port-80 listener');
 const existingProxy=read(['compute','target-http-proxies','list']).find(p=>p.name===proxyName);
 assert.ok(!existingProxy||existingProxy.urlMap.endsWith('/urlMaps/'+mapName),'Do not repurpose another URL map');
 const existingMap=read(['compute','url-maps','list']).find(m=>m.name===mapName);
 assert.ok(!existingMap||existingMap.description===redirectMap().description,'Do not overwrite an unrecognized map');
 const file='/tmp/elevate-public-http-redirect.json';writeFileSync(file,JSON.stringify(redirectMap(),null,2));
 // Create the unattached map first: this API validates a named existing resource.
 // Validate before connecting either a target proxy or the public HTTP listener.
 mutate(['compute','url-maps','import',mapName,'--source='+file,'--global']);
 mutate(['compute','url-maps','validate','--source='+file,'--global','--load-balancing-scheme='+frontend.scheme]);
 if(!existingProxy) mutate(['compute','target-http-proxies','create',proxyName,'--url-map='+mapName,'--global']);
 if(!occupied.length) mutate(['compute','forwarding-rules','create',ruleName,'--load-balancing-scheme='+frontend.scheme,'--address='+frontend.addressName,'--network-tier=PREMIUM','--global','--target-http-proxy='+proxyName,'--ports=80']);
 assert.equal(read(['compute','url-maps','describe','elevate-public-routes','--global']).fingerprint,map.fingerprint,'HTTPS routing must remain unchanged');
 let last;
 for(let attempt=0;attempt<18;attempt++) {
  try {
   for(const host of ['elevateforhumanity.org','www.elevateforhumanity.org']) {
    const path='/programs/barber-apprenticeship?source=entry';
    const response=await fetch('http://'+host+path,{redirect:'manual',signal:AbortSignal.timeout(15000)});
    const location=response.headers.get('location');await response.body?.cancel();
    assert.equal(response.status,301);assert.equal(location,'https://www.elevateforhumanity.org'+path);
    console.log(JSON.stringify({host,status:response.status,location,attempt:attempt+1}));
   }
   console.log('HTTP entry verified. Existing HTTPS routing retained.');return;
  }catch(error){last=error;console.log(JSON.stringify({attempt:attempt+1,error:error.message}));}
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
 throw last;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) await repair();
