const token=process.env.NORTHFLANK_API_TOKEN;
if(!token)throw new Error('Northflank token unavailable');
const vars={};
async function nf(path,project='elevate-platform'){
 const r=await fetch('https://api.northflank.com/v1/projects/'+project+path,{headers:{authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
 console.info(JSON.stringify({northflank:path,status:r.status}));
 if(!r.ok)return null;const j=await r.json();return j.data??j;
}
for(const id of ['elevate-production-env','elevate-llm-client-env']){
 const g=await nf('/secrets/'+id+'/details');
console.info(JSON.stringify({group:id,fields:Object.keys(g??{}),secretFields:Object.keys(g?.secrets??{}),matchingKeys:Object.keys(g?.secrets?.variables??g?.variables??g?.secrets??{}).filter(k=>/CLOUDFLARE|R2/.test(k))}));
Object.assign(vars,g?.secrets?.variables??g?.variables??g?.secrets??{});
}
const service=await nf('/services/elevate-marketing');console.info(JSON.stringify({serviceFields:Object.keys(service??{}),runtimeType:typeof service?.runtimeEnvironment}));
const groups=await nf('/secrets');console.info(JSON.stringify({groupList:groups?.secrets?.map(g=>({id:g.id,name:g.name})),listFields:Object.keys(groups??{})}));

for(const id of ['elevate-marketing','elevate-admin','elevate-lms','elevate-ultimate-worker']){
 const service=await nf('/services/'+id);
 const env=service?.runtimeEnvironment??{};
 const relevant=Object.fromEntries(Object.entries(env).filter(([k])=>/^(CLOUDFLARE_|R2_|NEXT_PUBLIC_R2_)/.test(k)));
 console.info(JSON.stringify({service:id,matchingKeys:Object.keys(relevant),types:Object.fromEntries(Object.entries(relevant).map(([k,v])=>[k,typeof v]))}));
 for(const [k,v] of Object.entries(relevant))if(typeof v==='string'&&v&&!v.includes('***'))vars[k]=v;
}
for(const id of ['elevate-gpu-client-env','elevate-cron-runtime']){
 const g=await nf('/secrets/'+id+'/details');const env=g?.secrets?.variables??{};
 const relevant=Object.fromEntries(Object.entries(env).filter(([k])=>/^(CLOUDFLARE_|R2_|NEXT_PUBLIC_R2_)/.test(k)));
 console.info(JSON.stringify({group:id,matchingKeys:Object.keys(relevant)}));Object.assign(vars,relevant);
}
const keys=['CLOUDFLARE_ACCOUNT_ID','CLOUDFLARE_API_TOKEN','CLOUDFLARE_AI_API_TOKEN','CLOUDFLARE_R2_ACCESS_KEY_ID','CLOUDFLARE_R2_SECRET_ACCESS_KEY','CLOUDFLARE_R2_BUCKET_NAME','CLOUDFLARE_R2_PUBLIC_URL','NEXT_PUBLIC_R2_URL'];
console.info(JSON.stringify({configured:Object.fromEntries(keys.map(k=>[k,typeof vars[k]==='string'&&!!vars[k]]))}));
for(const k of ['CLOUDFLARE_R2_PUBLIC_URL','NEXT_PUBLIC_R2_URL']){try{console.info(JSON.stringify({key:k,host:new URL(vars[k]).hostname}));}catch{}}
const mediaGroups=await nf('/secrets','elevate-media-gpu');
console.info(JSON.stringify({mediaGroups:mediaGroups?.secrets?.map(g=>({id:g.id,name:g.name}))}));
for(const group of mediaGroups?.secrets??[]){
 if(!/media|r2|cloudflare|worker/.test(group.id))continue;
 const g=await nf('/secrets/'+encodeURIComponent(group.id)+'/details','elevate-media-gpu');
 const env=g?.secrets?.variables??{};
 const relevant=Object.fromEntries(Object.entries(env).filter(([k])=>/^(CLOUDFLARE_|R2_|NEXT_PUBLIC_R2_)/.test(k)));
 console.info(JSON.stringify({mediaGroup:group.id,matchingKeys:Object.keys(relevant)}));Object.assign(vars,relevant);
}
const api=vars.CLOUDFLARE_API_TOKEN||vars.CLOUDFLARE_AI_API_TOKEN;const account=vars.CLOUDFLARE_ACCOUNT_ID;
console.info(JSON.stringify({tokenSource:vars.CLOUDFLARE_API_TOKEN?'CLOUDFLARE_API_TOKEN':'CLOUDFLARE_AI_API_TOKEN'}));
if(!api||!account)throw new Error('General Cloudflare API token or account missing');
async function cf(path){
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+path,{headers:{authorization:'Bearer '+api},signal:AbortSignal.timeout(30000)});
 console.info(JSON.stringify({cloudflare:path,status:r.status}));
 const j=await r.json();if(!r.ok||!j.success){console.info(JSON.stringify({errors:j.errors?.map(e=>({code:e.code,message:String(e.message??'').replaceAll(api,'[redacted]').replaceAll(account,'[account]').slice(0,300)}))}));return null;}return j.result;
}
const accountResponse=await fetch('https://api.cloudflare.com/client/v4/accounts',{headers:{authorization:'Bearer '+api},signal:AbortSignal.timeout(30000)});
const accountData=await accountResponse.json();
console.info(JSON.stringify({accountListingStatus:accountResponse.status,accounts:accountData.result?.map(a=>({name:a.name,configured:a.id===account}))}));
const subscriptions=await cf('/subscriptions');
console.info(JSON.stringify({subscriptions:subscriptions?.map(s=>({id:s.id,state:s.state,rate_plan:s.rate_plan,current_period_end:s.current_period_end,price:s.price,currency:s.currency}))}));
const buckets=await cf('/r2/buckets');
const names=new Set([vars.CLOUDFLARE_R2_BUCKET_NAME||'elevate-media',...(buckets?.buckets??[]).map(b=>b.name)]);
console.info(JSON.stringify({buckets:[...names]}));
for(const name of names){
 const path='/r2/buckets/'+encodeURIComponent(name)+'/domains/';
 const managed=await cf(path+'managed'); const custom=await cf(path+'custom');
 console.info(JSON.stringify({bucket:name,managed:managed&&{domain:managed.domain,enabled:managed.enabled},custom:custom?.domains?.map(d=>({domain:d.domain,enabled:d.enabled,status:d.status}))}));
}
