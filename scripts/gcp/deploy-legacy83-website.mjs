import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const project='elegant-racer-299721',zone='us-central1-a',region='us-central1';
const vm='legacy83-website',tag='legacy83-website',address='legacy83-website-ip';
const sha=process.env.SOURCE_SHA;
if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Approved source revision required');
const imageBase='us-central1-docker.pkg.dev/'+project+'/elevate/legacy83-candidate';
const runId=process.env.GITHUB_RUN_ID;
if(!/^[0-9]+$/.test(runId||''))throw Error('Workflow identifier required');
const temporaryRule='legacy83-ssh-'+runId;
const q=value=>"'"+String(value).replaceAll("'","'\\''")+"'";
function command(args,input,timeout=120000){
 try{return execFileSync('gcloud',args,{input,encoding:'utf8',timeout,maxBuffer:12*1024*1024,stdio:['pipe','pipe','pipe']}).trim();}
 catch(error){const text=String(error.stderr||'');const code=/PERMISSION_DENIED|QUOTA_EXCEEDED|ZONE_RESOURCE_POOL_EXHAUSTED|RESOURCE_EXHAUSTED|not found|Connection refused|Permission denied/.exec(text)?.[0]||'command failed';throw Error(args.slice(0,3).join(' ')+': '+code);}
}
function gc(args,input,timeout){return command([...args,'--project='+project,'--quiet'],input,timeout);}
function json(args){return JSON.parse(gc([...args,'--format=json']));}
function ssh(script,input,timeout=120000){
 return gc(['compute','ssh','legacy83_deploy@'+vm,'--zone='+zone,'--ssh-key-file='+process.env.RUNNER_TEMP+'/legacy83-deploy-key','--ssh-key-expire-after=30m','--strict-host-key-checking=yes','--ssh-flag=-oConnectTimeout=10','--command='+script],input,timeout);
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let created=false,ruleCreated=false,passed=false,instance;
try {
 const ips=json(['compute','addresses','list','--filter=name='+address]);
 if(!ips.some(x=>x.name===address))gc(['compute','addresses','create',address,'--region='+region,'--labels=customer=legacy83']);
 const ip=json(['compute','addresses','describe',address,'--region='+region]).address;
 if(!/^[0-9]{1,3}([.][0-9]{1,3}){3}$/.test(ip))throw Error('Reserved public IPv4 required');
 const hostname='legacy83-'+ip.replaceAll('.','-')+'.sslip.io';
 const candidates=json(['compute','instances','list','--filter=name='+vm]);
 instance=candidates.find(x=>x.name===vm);
 if(instance&&(instance.labels?.customer!=='legacy83'||!instance.zone.endsWith('/'+zone)))throw Error('Refusing to modify an unrelated VM');
 for(const [name,extra] of [
  ['legacy83-web',['--action=ALLOW','--rules=tcp:80,tcp:443','--source-ranges=0.0.0.0/0','--priority=1000']],
  ['legacy83-ssh-deny',['--action=DENY','--rules=tcp:22','--source-ranges=0.0.0.0/0','--priority=1001']]
 ]){
  if(!json(['compute','firewall-rules','list','--filter=name='+name]).some(x=>x.name===name)){
   gc(['compute','firewall-rules','create',name,'--network=default','--direction=INGRESS','--target-tags='+tag,...extra]);
  }
 }
 const runnerResponse=await fetch('https://api.ipify.org',{signal:AbortSignal.timeout(15000)});
 const runnerIp=(await runnerResponse.text()).trim();
 if(!runnerResponse.ok||!/^[0-9]{1,3}([.][0-9]{1,3}){3}$/.test(runnerIp)||runnerIp.split('.').some(x=>+x>255))throw Error('Workflow IPv4 unavailable');
 gc(['compute','firewall-rules','create',temporaryRule,'--network=default','--direction=INGRESS','--action=ALLOW','--rules=tcp:22','--source-ranges='+runnerIp+'/32','--target-tags='+tag,'--priority=1000']);
 ruleCreated=true;
 if(!instance){
  gc(['compute','instances','create',vm,'--zone='+zone,'--machine-type=e2-small','--address='+ip,'--image-family=ubuntu-2404-lts-amd64','--image-project=ubuntu-os-cloud','--boot-disk-size=20GB','--boot-disk-type=pd-balanced','--no-service-account','--no-scopes','--tags='+tag,'--labels=customer=legacy83,purpose=managed-website','--metadata=block-project-ssh-keys=true,enable-guest-attributes=TRUE','--metadata-from-file=startup-script=scripts/gcp/legacy83-startup.sh'],undefined,300000);
  created=true;
 }else if(instance.status==='TERMINATED')gc(['compute','instances','start',vm,'--zone='+zone],undefined,180000);
 instance=json(['compute','instances','describe',vm,'--zone='+zone]);
 if(instance.serviceAccounts?.length)throw Error('Website runtime must have no cloud service account');
 let ready=false;
 for(let attempt=0;attempt<24;attempt++){
  try{ssh('test -f /run/legacy83-host-ready && sudo docker info >/dev/null');ready=true;break;}
  catch{await sleep(10000);}
 }
 if(!ready)throw Error('Website host startup or verified SSH failed');
 const digest=gc(['artifacts','docker','images','describe',imageBase+':'+sha,'--format=value(image_summary.digest)']);
 if(!/^sha256:[a-f0-9]{64}$/.test(digest))throw Error('Immutable image digest required');
 const image=imageBase+'@'+digest;
 // Registry credentials travel only on verified SSH stdin, never in metadata or logs.
 const token=command(['auth','print-access-token']);
 const pull='set -euo pipefail; install -d -m 700 /run/legacy83-registry; export DOCKER_CONFIG=/run/legacy83-registry; trap '+q('rm -rf /run/legacy83-registry')+' EXIT; docker login -u oauth2accesstoken --password-stdin https://us-central1-docker.pkg.dev >/dev/null 2>&1; docker pull '+q(image)+' >/dev/null';
 ssh('sudo bash -c '+q(pull),token+'\n',300000);
 const env={
  NEXT_PUBLIC_SUPABASE_URL:'https://vhulnzcfmlnsmoxixjco.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  LEGACY83_REVISION:sha,PORT:'8080',HOSTNAME:'0.0.0.0'
 };
 if(!env.NEXT_PUBLIC_SUPABASE_ANON_KEY||Object.values(env).some(x=>/[\r\n\0]/.test(x)))throw Error('Invalid customer runtime configuration');
 ssh('sudo install -m 600 /dev/stdin /etc/legacy83/runtime.env',Object.entries(env).map(([k,v])=>k+'='+v).join('\n')+'\n');
 const priorPort=ssh('sudo cat /etc/legacy83/active-port 2>/dev/null || true').trim();
 const port=priorPort==='8080'?'8081':'8080',container='legacy83-'+sha.slice(0,12);
 ssh('sudo docker rm -f '+q(container)+' >/dev/null 2>&1 || true');
 ssh('sudo docker run -d --name '+q(container)+' --restart=always --init --memory=1g --memory-swap=1g --cpus=1 --pids-limit=256 --cap-drop=ALL --security-opt=no-new-privileges --log-opt=max-size=10m --log-opt=max-file=3 --env-file=/etc/legacy83/runtime.env --publish=127.0.0.1:'+port+':8080 '+q(image)+' >/dev/null');
 let appReady=false;
 for(let attempt=0;attempt<40;attempt++){
  try{const health=JSON.parse(ssh('curl --fail --silent http://127.0.0.1:'+port+'/api/health'));if(health.service==='legacy83'&&health.revision===sha){appReady=true;break;}}
  catch{}
  await sleep(3000);
 }
 if(!appReady)throw Error('Candidate image did not become healthy');
 const caddy=hostname+' {\n  header X-Robots-Tag "noindex, nofollow"\n  encode zstd gzip\n  reverse_proxy 127.0.0.1:'+port+'\n}\n';
 ssh('sudo install -m 644 /dev/stdin /etc/legacy83/Caddyfile.next',caddy);
 ssh('sudo docker pull caddy:2 >/dev/null');
 ssh('sudo docker run --rm --volume=/etc/legacy83:/etc/caddy:ro caddy:2 caddy validate --config /etc/caddy/Caddyfile.next --adapter caddyfile >/dev/null');
 ssh('sudo bash -c '+q('if test -f /etc/legacy83/Caddyfile; then cp /etc/legacy83/Caddyfile /etc/legacy83/Caddyfile.previous; fi; mv /etc/legacy83/Caddyfile.next /etc/legacy83/Caddyfile'));
 const proxyExists=ssh("sudo docker ps --filter=name=^legacy83-proxy$ --format='{{.Names}}'");
 if(proxyExists==='legacy83-proxy'){
  try{ssh('sudo docker exec legacy83-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null');}
  catch(error){ssh('sudo cp /etc/legacy83/Caddyfile.previous /etc/legacy83/Caddyfile && sudo docker exec legacy83-proxy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null');throw error;}
 }else{
  ssh('sudo docker rm -f legacy83-proxy >/dev/null 2>&1 || true');
  ssh('sudo docker run -d --name legacy83-proxy --restart=always --network=host --log-opt=max-size=10m --log-opt=max-file=3 --volume=/etc/legacy83:/etc/caddy:ro --volume=/var/lib/legacy83/caddy:/data --volume=/var/lib/legacy83/caddy-config:/config caddy:2 >/dev/null');
 }
 const base='https://'+hostname;
 let tlsReady=false;
 for(let attempt=0;attempt<40;attempt++){
  try{const response=await fetch(base+'/api/health',{signal:AbortSignal.timeout(10000)});const health=await response.json();if(response.ok&&health.revision===sha){tlsReady=true;break;}}
  catch{}
  await sleep(5000);
 }
 if(!tlsReady)throw Error('Trusted HTTPS readiness did not pass');
 for(const path of ['/','/about','/services','/academy','/resources','/contact','/growth-iq','/journal','/events','/schedule-a-call']){
  const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  console.log(JSON.stringify({path,status:response.status}));
  if(response.status!==200)throw Error('Website page failed: '+path);
 }
 const retired=await fetch(base+'/quiz',{redirect:'manual'});
 if(![307,308].includes(retired.status)||retired.headers.get('location')!=='/growth-iq')throw Error('Retired assessment route did not reach reviewed flow');
 ssh('sudo install -m 644 /dev/stdin /etc/legacy83/active-port',port+'\n');
 // Remove the old container only after HTTPS and all reviewed routes pass.
 ssh('sudo bash -c '+q('for id in $(docker ps -aq --filter name=legacy83-); do name=$(docker inspect --format "{{.Name}}" "$id"); case "$name" in /'+container+'|/legacy83-proxy) ;; *) docker rm -f "$id" >/dev/null ;; esac; done'));
 console.log(JSON.stringify({candidateUrl:base,revision:sha,image,noRuntimeCloudIdentity:true,tlsVerified:true,customerDatabase:'vhulnzcfmlnsmoxixjco',publicDomainChanged:false}));
 writeFileSync(process.env.GITHUB_ENV,'LEGACY83_CANDIDATE_URL='+base+'\n',{flag:'a'});
 writeFileSync(process.env.GITHUB_STEP_SUMMARY,'Legacy 83 verified candidate: '+base+'\nSource: '+sha+'\n',{flag:'a'});
 passed=true;
} finally {
 if(ruleCreated)gc(['compute','firewall-rules','delete',temporaryRule]);
 if(!passed&&created)gc(['compute','instances','stop',vm,'--zone='+zone],undefined,180000);
}
