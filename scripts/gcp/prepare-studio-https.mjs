import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {googleFailureCode} from './runtime-config.mjs';
import {unitFile} from './deploy-studio-vm-trial.mjs';
import {verifyDns,verifyTls} from './verify-production-dns.mjs';

const project='elegant-racer-299721',zone='us-central1-a';
const vm='elevate-studio-browser-trial',host='browser.elevateforhumanity.org';
const backend='elevate-studio-browser-backend',group='elevate-studio-browser-group',health='elevate-studio-browser-health';
const image='us-central1-docker.pkg.dev/'+project+'/elevate/studio-browser@sha256:16df0b2bb22312b55c49c124ebe519b980dd17175309e7f3904f8ad9414232a8';
const commit='ce624a5dc01b2fcb8f633c04b22c32b1e0c749f0';
const purpose='Persistent isolated Studio browser; tested by run 38035943205';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function cli(args,input,timeout=90000){try{return execFileSync('gcloud',[...args,'--project='+project,'--quiet'],{input,encoding:'utf8',timeout,maxBuffer:8*1024*1024,stdio:['pipe','pipe','pipe']}).trim();}catch(e){throw Error(args.slice(0,3).join(' ')+': '+googleFailureCode(String(e.stderr||'')));}}
function read(args){return JSON.parse(cli([...args,'--format=json']));}
function ssh(script,input,timeout=90000){return cli(['compute','ssh','studio_deploy@'+vm,'--zone='+zone,'--ssh-key-file='+process.env.RUNNER_TEMP+'/studio-public-key','--ssh-key-expire-after=30m','--strict-host-key-checking=yes','--command='+script,'--ssh-flag=-oConnectTimeout=10'],input,timeout);}

export function checkHostRoute(map){
  if(map.name!=='elevate-public-routes')throw Error('Unexpected public URL map');
  const matches=(map.hostRules||[]).filter(r=>r.hosts?.includes(host));
  if(matches.length>1)throw Error('Conflicting browser host routes');
  if(!matches.length)return false;
  const matcher=(map.pathMatchers||[]).find(m=>m.name===matches[0].pathMatcher);
  if(matches[0].pathMatcher!=='studio-browser'||!matcher?.defaultService?.endsWith('/'+backend)||matcher.pathRules?.length||matcher.routeRules?.length)throw Error('Existing browser route requires review');
  return true;
}

export function publicUnit(privateIp){
  if(!/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(privateIp)||privateIp.split('.').some(x=>Number(x)>255))throw Error('Expected a private Google network address');
  return unitFile(image).replace('ExecStartPre=-/usr/bin/docker rm studio-browser','ExecStartPre=/usr/local/sbin/elevate-studio-firewall\nExecStartPre=-/usr/bin/docker rm studio-browser').replace('--publish=127.0.0.1:3100:3100','--publish=127.0.0.1:3100:3100 --publish='+privateIp+':3100:3100');
}

export const hostFirewall=`#!/usr/bin/env bash
set -euo pipefail
# Docker-published ports traverse DOCKER-USER. Restrict this browser's port even
# if a pre-existing VPC rule happens to allow other inbound traffic.
iptables -N ELEVATE_STUDIO_EDGE 2>/dev/null || true
iptables -F ELEVATE_STUDIO_EDGE
iptables -A ELEVATE_STUDIO_EDGE -s 130.211.0.0/22 -j RETURN
iptables -A ELEVATE_STUDIO_EDGE -s 35.191.0.0/16 -j RETURN
iptables -A ELEVATE_STUDIO_EDGE -j DROP
iptables -C DOCKER-USER -p tcp --dport 3100 -j ELEVATE_STUDIO_EDGE 2>/dev/null || iptables -I DOCKER-USER 1 -p tcp --dport 3100 -j ELEVATE_STUDIO_EDGE
`;

export async function prepare(){
  const report={observedAt:new Date().toISOString(),host,vm,image,commit,adminConnected:false,providerSessionsRecovered:false};
  mkdirSync('reports/studio-public',{recursive:true});
  let temporaryFirewall,keepRunning=false;
  try{
    if(process.env.GITHUB_REF!=='refs/heads/main')throw Error('Production changes require main');
    let instance=read(['compute','instances','describe',vm,'--zone='+zone]);
    if(!['studio-isolation-trial','studio-browser-ready'].includes(instance.labels?.purpose)||instance.serviceAccounts?.length)throw Error('Unexpected VM ownership or identity');
    const map=read(['compute','url-maps','describe','elevate-public-routes','--global']);checkHostRoute(map);
    const proxies=read(['compute','target-https-proxies','list']).filter(p=>p.urlMap?.endsWith('/elevate-public-routes'));
    const rules=read(['compute','forwarding-rules','list']).filter(r=>proxies.some(p=>p.selfLink===r.target)&&(r.portRange==='443-443'||r.portRange==='443'||r.ports?.includes('443')));
    const addresses=[...new Set(rules.map(r=>r.IPAddress))];
    if(addresses.length!==1||!/^\d+(\.\d+){3}$/.test(addresses[0]))throw Error('Expected one existing Google HTTPS IPv4 frontend');
    report.requiredDns={type:'A',name:host,value:addresses[0]};
    try{report.dns=verifyDns(host,addresses);}catch{report.dns={passed:false,reason:'dns_verification_failed'};}
    // Verify the existing certificate independently of browser DNS. This is a
    // normal TLS hostname check; never disable certificate validation.
    try{execFileSync('curl',['--silent','--show-error','--max-time','20','--resolve',host+':443:'+addresses[0],'--output','/dev/null','https://'+host+'/health'],{encoding:'utf8',timeout:25000,stdio:['ignore','pipe','pipe']});report.edgeCertificateValid=true;}
    catch{report.edgeCertificateValid=false;throw Error('Existing Google edge certificate does not yet verify for the browser hostname');}
    const admin=read(['run','services','describe','elevate-admin-migration','--region=us-central1']);
    const variable=admin.spec.template.spec.containers[0].env.find(e=>e.name==='STUDIO_BROWSER_SECRET');
    let secret=variable?.value;if(!secret&&variable?.valueFrom?.secretKeyRef){const ref=variable.valueFrom.secretKeyRef;secret=cli(['secrets','versions','access',ref.key||'latest','--secret='+ref.name]);}
    if(!secret||secret.length<16)throw Error('Existing browser credential unavailable');
    const ipResponse=await fetch('https://api.ipify.org',{signal:AbortSignal.timeout(15000)});const runnerIp=(await ipResponse.text()).trim();
    if(!ipResponse.ok||!/^\d+(\.\d+){3}$/.test(runnerIp))throw Error('Runner IPv4 unavailable');
    const runId=process.env.GITHUB_RUN_ID;if(!/^\d+$/.test(runId||''))throw Error('Workflow run ID required');
    const rule='studio-public-ssh-'+runId;
    cli(['compute','firewall-rules','create',rule,'--network=default','--direction=INGRESS','--allow=tcp:22','--source-ranges='+runnerIp+'/32','--target-tags='+vm,'--description=Temporary Studio deployment SSH']);temporaryFirewall=rule;
    if(instance.status==='TERMINATED')cli(['compute','instances','start',vm,'--zone='+zone],undefined,180000);
    instance=read(['compute','instances','describe',vm,'--zone='+zone]);
    let connected=false;for(let n=0;n<18;n++){try{ssh('sudo docker inspect studio-browser --format="{{.State.Running}}"');connected=true;break;}catch{await pause(10000);}}
    if(!connected)throw Error('Verified SSH unavailable');
    const before=JSON.parse(ssh('curl --silent --fail http://127.0.0.1:3100/health'));
    if(before.commit!==commit||!before.ready||!before.providerAuthStorage?.persistent)throw Error('Previously tested browser is not healthy');
    const ip=instance.networkInterfaces?.[0]?.networkIP;
    ssh('sudo install -m 700 /dev/stdin /usr/local/sbin/elevate-studio-firewall',hostFirewall);
    ssh('sudo install -m 644 /dev/stdin /etc/systemd/system/elevate-studio.service',publicUnit(ip));
    ssh('sudo systemctl daemon-reload && sudo systemctl restart elevate-studio');
    const edgeRule='elevate-studio-browser-edge';
    const existingFirewall=read(['compute','firewall-rules','list','--filter=name='+edgeRule]).find(r=>r.name===edgeRule);
    if(existingFirewall){if(existingFirewall.description!==purpose)throw Error('Existing edge firewall requires review');}
    else cli(['compute','firewall-rules','create',edgeRule,'--network=default','--direction=INGRESS','--allow=tcp:3100','--source-ranges=130.211.0.0/22,35.191.0.0/16','--target-tags='+vm,'--description='+purpose]);
    const groups=read(['compute','instance-groups','unmanaged','list','--filter=name='+group]);
    if(!groups.length)cli(['compute','instance-groups','unmanaged','create',group,'--zone='+zone,'--description='+purpose]);
    else if(groups.length!==1||groups[0].description!==purpose)throw Error('Existing instance group requires review');
    const members=read(['compute','instance-groups','unmanaged','list-instances',group,'--zone='+zone]);
    if(members.some(m=>!m.instance.endsWith('/'+vm)))throw Error('Unexpected backend member');
    if(!members.length)cli(['compute','instance-groups','unmanaged','add-instances',group,'--zone='+zone,'--instances='+vm]);
    cli(['compute','instance-groups','set-named-ports',group,'--zone='+zone,'--named-ports=http:3100']);
    const checks=read(['compute','health-checks','list','--filter=name='+health]);
    if(!checks.length)cli(['compute','health-checks','create','http',health,'--global','--port=3100','--request-path=/health','--check-interval=10s','--timeout=5s','--description='+purpose]);
    else if(checks.length!==1||checks[0].description!==purpose)throw Error('Existing health check requires review');
    const existing=read(['compute','backend-services','list','--filter=name='+backend]);
    if(!existing.length)cli(['compute','backend-services','create',backend,'--global','--protocol=HTTP','--port-name=http','--health-checks='+health,'--timeout=3600s','--load-balancing-scheme='+(rules[0].loadBalancingScheme||'EXTERNAL'),'--description='+purpose]);
    const service=read(['compute','backend-services','describe',backend,'--global']);
    if(service.description!==purpose||(service.backends||[]).some(b=>!b.group.endsWith('/'+group)))throw Error('Existing browser backend requires review');
    if(!service.backends?.length)cli(['compute','backend-services','add-backend',backend,'--global','--instance-group='+group,'--instance-group-zone='+zone,'--balancing-mode=UTILIZATION','--max-utilization=0.8']);
    let healthy=false;for(let n=0;n<30;n++){const state=read(['compute','backend-services','get-health',backend,'--global']);if(state.some(s=>s.status?.healthStatus?.some(h=>h.healthState==='HEALTHY'))){healthy=true;break;}await pause(10000);}
    if(!healthy)throw Error('Google browser backend did not become healthy');report.backendHealthy=true;
    const currentMap=read(['compute','url-maps','describe','elevate-public-routes','--global']);
    if(!checkHostRoute(currentMap))cli(['compute','url-maps','add-path-matcher','elevate-public-routes','--global','--path-matcher-name=studio-browser','--default-service='+backend,'--new-hosts='+host]);
    report.browserRoutePrepared=true;
    // curl stdin config carries the shared secret, never command arguments.
    const config='url = '+JSON.stringify('https://'+host+'/workspace/files')+'\nresolve = '+JSON.stringify(host+':443:'+addresses[0])+'\nheader = '+JSON.stringify('x-studio-browser-secret: '+secret)+'\n';
    let edgeReady=false;for(let n=0;n<30;n++){try{const body=execFileSync('curl',['--silent','--show-error','--fail','--max-time','15','--resolve',host+':443:'+addresses[0],'https://'+host+'/health'],{encoding:'utf8',timeout:20000,stdio:['ignore','pipe','pipe']});const state=JSON.parse(body);if(state.ready&&state.commit===commit&&state.providerAuthStorage?.persistent){edgeReady=true;break;}}catch{}await pause(10000);}
    if(!edgeReady)throw Error('Exact Studio image is not ready through Google HTTPS');
    execFileSync('curl',['--config','-','--silent','--show-error','--fail','--max-time','20','--output','/dev/null'],{input:config,encoding:'utf8',timeout:25000,stdio:['pipe','pipe','pipe']});
    const denied=execFileSync('curl',['--silent','--show-error','--max-time','15','--resolve',host+':443:'+addresses[0],'--output','/dev/null','--write-out','%{http_code}','https://'+host+'/workspace/files'],{encoding:'utf8',timeout:20000,stdio:['ignore','pipe','pipe']});
    if(denied!=='401')throw Error('Anonymous browser workspace access was not denied');
    report.authorizedHttps=true;report.anonymousDenied=true;
    const nat=instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;
    let directBlocked=false;try{const r=await fetch('http://'+nat+':3100/health',{signal:AbortSignal.timeout(5000)});await r.body?.cancel();}catch{directBlocked=true;}
    if(!directBlocked)throw Error('Browser port is accessible outside the Google edge');report.directPortBlocked=true;
    cli(['compute','instances','add-labels',vm,'--zone='+zone,'--labels=purpose=studio-browser-ready']);
    keepRunning=true;
    report.publicTls=await verifyTls(host);report.publicReady=report.dns.passed&&report.publicTls.passed;
    report.nextStep=report.publicReady?'Connect Admin after deployment and queue checks':'Point the browser DNS A record to the existing Google HTTPS frontend';
  }catch(error){report.error=error.message.startsWith('Command failed')?'HTTPS acceptance command failed':error.message;}
  finally{
    if(!keepRunning){try{const current=read(['compute','instances','describe',vm,'--zone='+zone]);if(current.status!=='TERMINATED'&&['studio-isolation-trial','studio-browser-ready'].includes(current.labels?.purpose))cli(['compute','instances','stop',vm,'--zone='+zone],undefined,180000);report.stopped=true;}catch{report.stopFailed=true;}}
    if(temporaryFirewall){try{cli(['compute','firewall-rules','delete',temporaryFirewall]);report.temporarySshRuleRemoved=true;}catch{report.firewallCleanupFailed=true;}}
    writeFileSync('reports/studio-public/readiness.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }
  if(!report.publicReady||report.error||report.stopFailed||report.firewallCleanupFailed)process.exitCode=1;
  return report;
}
export function cleanup(){
  const runId=process.env.GITHUB_RUN_ID;if(!/^\d+$/.test(runId||''))throw Error('Workflow run ID required');
  const rule='studio-public-ssh-'+runId;
  if(read(['compute','firewall-rules','list','--filter=name='+rule]).some(r=>r.name===rule))cli(['compute','firewall-rules','delete',rule]);
  const instance=read(['compute','instances','describe',vm,'--zone='+zone]);
  if(instance.labels?.purpose==='studio-isolation-trial'&&instance.status!=='TERMINATED')cli(['compute','instances','stop',vm,'--zone='+zone],undefined,180000);
  console.log(JSON.stringify({temporarySshRuleRemoved:true,preparedBrowserPreserved:instance.labels?.purpose==='studio-browser-ready'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){if(process.argv.includes('--cleanup'))cleanup();else await prepare();}
