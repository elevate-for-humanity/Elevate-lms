import {Resolver} from 'node:dns/promises';
const resolver=new Resolver({timeout:3000,tries:2});
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const domain='elevateforhumanity.org',base='https://api.northflank.com/v1';
const headers={Authorization:'Bearer '+process.env.NORTHFLANK_API_TOKEN};
async function request(path,method='GET') {
 const r=await fetch(base+path,{method,headers,signal:AbortSignal.timeout(30000)});
 if(!r.ok&&r.status!==404)throw Error('Northflank '+method+' HTTP '+r.status);
 return {status:r.status,body:r.status===404?null:await r.json()};
}
async function main() {
 const detail=await request('/domains/'+domain);
 if(detail.status!==404) {
  const d=detail.body.data??detail.body;
  if(d.name!==domain||!Array.isArray(d.subdomains))throw Error('Domain inventory mismatch');
  const hosts=[domain,...d.subdomains.map(s=>s.fullName)];
  for(const host of [...new Set(hosts)]) {
   if(host!==domain&&!host.endsWith('.'+domain))throw Error('Unexpected domain; no deletion');
   if(host.startsWith('*.'))continue;
   console.log(JSON.stringify({kind:'checkingDns',host}));
   let ips;try{ips=await resolver.resolve4(host);}catch(e){if(['ENODATA','ENOTFOUND'].includes(e.code)){console.log(JSON.stringify({kind:'dns',host,alreadyUnrouted:true}));continue;}throw e;}
   const expected=host==='phone.'+domain?'107.178.216.162':'34.110.235.233';
   if(!ips.length||ips.some(ip=>ip!==expected))throw Error('Domain not verified on Google: '+host);
   console.log(JSON.stringify({kind:'dns',host,ips,googleVerified:true}));
  }
  for(const host of ['www','app','admin','store']) {
   console.log(JSON.stringify({kind:'checkingHealth',host}));
   const r=await fetch('https://'+host+'.'+domain+'/api/health',{signal:AbortSignal.timeout(120000)});
   const b=await r.json();if(!r.ok||!b.healthy)throw Error('Google website health failed; no deletion');
  }
  writeFileSync('northflank-domain-inventory.json',JSON.stringify({domain:d.name,status:d.status,subdomains:d.subdomains},null,2));
  const removed=await request('/domains/'+domain,'DELETE');
  if(![200,204].includes(removed.status))throw Error('Domain deletion failed');
  const check=await request('/domains/'+domain);
  if(check.status!==404)throw Error('Northflank domain deletion not verified');
  console.log(JSON.stringify({kind:'domainRetirement',domain,removed:true,googleHealthVerified:true,durableDnsUnchanged:true}));
 } else console.log(JSON.stringify({kind:'domainRetirement',domain,alreadyAbsent:true}));
 const inventory=await request('/domains?per_page=100');
 const listed=inventory.body.data??inventory.body;
 if(!Array.isArray(listed.domains)||inventory.body.pagination?.hasNextPage)throw Error('Complete remaining domain inventory required');
 for(const row of listed.domains.filter(d=>d.name===domain||d.name.endsWith('.'+domain))) {
  const host=row.name;let ips;try{ips=await resolver.resolve4(host);}catch(e){if(!['ENOTFOUND','ENODATA'].includes(e.code))throw e;ips=[];}
  const expected=host==='phone.'+domain?'107.178.216.162':'34.110.235.233';
  if(ips.some(ip=>ip!==expected))throw Error('Remaining domain has unverified routing: '+host);
  for(const name of ['www','app','admin','store']) {
   const r=await fetch('https://'+name+'.'+domain+'/api/health',{signal:AbortSignal.timeout(120000)});
   const b=await r.json();if(!r.ok||!b.healthy)throw Error('Google health failed; remaining registration retained');
  }
  await request('/domains/'+encodeURIComponent(host),'DELETE');
  if((await request('/domains/'+encodeURIComponent(host))).status!==404)throw Error('Remaining registration deletion not verified');
  console.log(JSON.stringify({kind:'domainRetirement',domain:host,removed:true,durableDnsUnchanged:true}));
 }
 const files=execFileSync('git',['ls-files','apps','components','lib','services','config','.github/workflows'],{encoding:'utf8'}).split('\n').filter(Boolean);
 const fs=await import('node:fs');let hits=0;
 for(const file of files) {
  let content;try{content=fs.readFileSync(file,'utf8');}catch{continue;}
  for(const [index,line] of content.split('\n').entries()) {
   const matches=line.match(/https?:\/\/[^\s"'\x60<>]+/g)||[];
   for(const value of matches) {
    let url;try{url=new URL(value);}catch{continue;}
    if(['code.run','northflank.app'].some(d=>url.hostname===d||url.hostname.endsWith('.'+d))) {
     hits++;console.log(JSON.stringify({kind:'legacyUrl',file,line:index+1,host:url.hostname}));
    }
   }
  }
 }
 console.log(JSON.stringify({kind:'repositoryRouting',legacyUrlCount:hits}));
}
main().catch(e=>{console.error(JSON.stringify({retired:false,reason:e.message}));process.exitCode=1;});
