import {execFileSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {loadGoogleConfig, googleFailureCode} from './runtime-config.mjs';

const project='elegant-racer-299721', zone='us-central1-a';
const vm='elevate-studio-browser-trial', disk='elevate-studio-browser-auth-trial';
const label='studio-isolation-trial', folder='reports/studio-vm';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const quote=s=>"'"+String(s).replaceAll("'", "'\\''")+"'";

export function runtimeEnvironment(config, secret) {
  if(typeof secret!=='string'||secret.length<16)throw Error('Existing Admin browser credential is required');
  const source=config.runtimeEnvironment;
  if(source.STUDIO_BROWSER_SECRET && source.STUDIO_BROWSER_SECRET!==secret)throw Error('Browser encryption key mismatch; refusing rotation');
  if(Object.keys(config.runtimeFiles).length)throw Error('Runtime files require an explicit migration before this trial');
  const env=Object.fromEntries(Object.entries(source).filter(([key])=>/^(STUDIO_|ULTIMATE_LEARNER_RUNTHROUGH_SECRET$)/.test(key)));
  Object.assign(env,{STUDIO_BROWSER_SECRET:secret, STUDIO_BROWSER_AUTH_STATE_DIR:'/var/lib/studio-browser-auth',STUDIO_BROWSER_ADMIN_ORIGIN:'https://admin.elevateforhumanity.org',PORT:'3100'});
  for(const [key,value]of Object.entries(env))if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)||typeof value!=='string'||/[\r\n\0]/.test(value))throw Error('Unsupported Docker environment value');
  return Object.entries(env).map(([k,v])=>k+'='+v).join('\n')+'\n';
}

export function mountScript(fresh) {
  return `set -euo pipefail
device=/dev/disk/by-id/google-${disk}
test -b "$device"
kind=$(blkid -p -o value -s TYPE "$device" || true)
if [ -z "$kind" ]; then
  ${fresh ? 'test -z "$(wipefs -n --noheadings -o TYPE "$device")"\n  mkfs.ext4 -m 0 "$device"' : 'echo "Refusing to format a retained disk" >&2; exit 1'}
else
  test "$kind" = ext4
fi
install -d -m 700 /var/lib/elevate-studio
uuid=$(blkid -s UUID -o value "$device")
test -n "$uuid"
if ! grep -q "UUID=$uuid " /etc/fstab; then
  printf 'UUID=%s /var/lib/elevate-studio ext4 defaults 0 2\\n' "$uuid" >> /etc/fstab
fi
mountpoint -q /var/lib/elevate-studio || mount /var/lib/elevate-studio
install -d -o 1001 -g 1001 -m 700 /var/lib/elevate-studio/auth /var/lib/elevate-studio/workspace
`;
}

export function unitFile(image) {
  if(!/^us-central1-docker\.pkg\.dev\/elegant-racer-299721\/elevate\/studio-browser@sha256:[a-f0-9]{64}$/.test(image))throw Error('Immutable Studio image required');
  return `[Unit]
Description=Isolated Studio browser
Requires=docker.service
After=docker.service network-online.target
RequiresMountsFor=/var/lib/elevate-studio
[Service]
Restart=always
RestartSec=5
TimeoutStartSec=120
TimeoutStopSec=45
ExecStartPre=-/usr/bin/docker rm studio-browser
ExecStart=/usr/bin/docker run --name studio-browser --init --cpus=2 --memory=4g --memory-swap=4g --shm-size=1g --pids-limit=512 --cap-drop=ALL --security-opt=no-new-privileges --log-opt=max-size=10m --log-opt=max-file=3 --env-file=/etc/elevate-studio/runtime.env --publish=127.0.0.1:3100:3100 --mount=type=bind,src=/var/lib/elevate-studio/auth,dst=/var/lib/studio-browser-auth --mount=type=bind,src=/var/lib/elevate-studio/workspace,dst=/workspace/project ${image}
ExecStop=/usr/bin/docker stop --time=30 studio-browser
[Install]
WantedBy=multi-user.target
`;
}

function command(args,input,timeout=90000) {
  try{return execFileSync('gcloud',args,{input,encoding:'utf8',timeout,maxBuffer:8*1024*1024,stdio:['pipe','pipe','pipe']}).trim();}
  catch(error){const code=googleFailureCode(String(error.stderr||''));throw Error(args.slice(0,3).join(' ')+': '+code);}
}
function gc(args,input,timeout){return command([...args,'--project='+project,'--quiet'],input,timeout);}
function json(args){return JSON.parse(gc([...args,'--format=json']));}
function ssh(script,input,timeout=90000){return gc(['compute','ssh','studio_deploy@'+vm,'--zone='+zone,'--ssh-key-file='+process.env.RUNNER_TEMP+'/studio-trial-key','--ssh-key-expire-after=30m','--strict-host-key-checking=yes','--command='+script,'--ssh-flag=-oConnectTimeout=10'],input,timeout);}
function ownedInstance(){const instances=json(['compute','instances','list','--filter=name='+vm]);const instance=instances.find(x=>x.name===vm);if(instance&&(instance.labels?.purpose!==label||!instance.zone.endsWith('/'+zone)))throw Error('Existing VM is not this isolated trial');return instance;}

export async function runTrial(){
  mkdirSync(folder,{recursive:true});
  const report={observedAt:new Date().toISOString(),vm,disk,trafficChanged:false,providerSessionsRecovered:false,checks:{}};
  const runId=process.env.GITHUB_RUN_ID;
  if(!/^\d+$/.test(runId||''))throw Error('GitHub run identifier required');
  const firewall='studio-trial-ssh-'+runId;
  let firewallCreated=false, instance;
  try {
    if(process.env.GITHUB_REF!=='refs/heads/main')throw Error('Production trial requires main');
    const sha=process.env.GITHUB_SHA;if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Commit SHA required');
    const config=loadGoogleConfig('studio-browser');
    const admin=json(['run','services','describe','elevate-admin-migration','--region=us-central1']);
    const variable=admin.spec.template.spec.containers[0].env.find(x=>x.name==='STUDIO_BROWSER_SECRET');
    let secret=variable?.value;
    if(!secret&&variable?.valueFrom?.secretKeyRef){const ref=variable.valueFrom.secretKeyRef;secret=gc(['secrets','versions','access',ref.key||'latest','--secret='+ref.name]);}
    const env=runtimeEnvironment(config,secret);
    report.checks.existingConfigurationRead=true;
    const imageBase='us-central1-docker.pkg.dev/'+project+'/elevate/studio-browser';
    const digest=gc(['artifacts','docker','images','describe',imageBase+':'+sha,'--format=value(image_summary.digest)']);
    const image=imageBase+'@'+digest, unit=unitFile(image);report.image=image;report.commit=sha;
    const response=await fetch('https://api.ipify.org',{signal:AbortSignal.timeout(15000)});
    const runnerIp=(await response.text()).trim();
    if(!response.ok||!/^\d{1,3}(\.\d{1,3}){3}$/.test(runnerIp)||runnerIp.split('.').some(n=>Number(n)>255))throw Error('Runner IPv4 unavailable');
    instance=ownedInstance();
    const disks=json(['compute','disks','list','--filter=name='+disk]);
    const retained=disks.find(x=>x.name===disk);
    if(retained&&(retained.labels?.purpose!==label||!retained.zone.endsWith('/'+zone)))throw Error('Existing disk is not this isolated trial');
    const fresh=!retained;
    if(fresh)gc(['compute','disks','create',disk,'--zone='+zone,'--size=10GB','--type=pd-balanced','--labels=purpose='+label]);
    gc(['compute','firewall-rules','create',firewall,'--network=default','--direction=INGRESS','--allow=tcp:22','--source-ranges='+runnerIp+'/32','--target-tags='+vm,'--description=Temporary restricted SSH for isolated Studio validation']);firewallCreated=true;
    if(!instance){
      gc(['compute','instances','create',vm,'--zone='+zone,'--machine-type=e2-standard-2','--image-family=ubuntu-2404-lts-amd64','--image-project=ubuntu-os-cloud','--boot-disk-size=20GB','--boot-disk-type=pd-balanced','--disk=name='+disk+',device-name='+disk+',mode=rw,boot=no,auto-delete=no','--no-service-account','--no-scopes','--tags='+vm,'--labels=purpose='+label,'--metadata=block-project-ssh-keys=true,enable-guest-attributes=TRUE','--metadata-from-file=startup-script=scripts/gcp/studio-vm-startup.sh'],undefined,300000);
      instance=ownedInstance();
    }else if(instance.status==='TERMINATED')gc(['compute','instances','start',vm,'--zone='+zone],undefined,180000);
    if(instance.serviceAccounts?.length)throw Error('Trial must not have a Google service account');
    if(!instance.disks.some(d=>d.source.endsWith('/'+disk)&&d.autoDelete===false))throw Error('Durable disk attachment invalid');
    report.checks.noRuntimeGoogleIdentity=true;
    let ready=false;
    for(let attempt=0;attempt<24;attempt++){try{ssh('test -f /run/studio-host-ready && sudo docker info >/dev/null');ready=true;break;}catch{await sleep(10000);}}
    if(!ready)throw Error('Host startup or verified SSH failed');
    ssh('sudo bash -s',mountScript(fresh));
    ssh('sudo install -m 600 /dev/stdin /etc/elevate-studio/runtime.env',env);
    // Only this short-lived registry token crosses stdin; never metadata, argv or logs.
    const token=command(['auth','print-access-token']);
    ssh('sudo bash -c '+quote('set -euo pipefail; install -d -m 700 /run/studio-docker-auth; export DOCKER_CONFIG=/run/studio-docker-auth; trap \'rm -rf /run/studio-docker-auth\' EXIT; docker login -u oauth2accesstoken --password-stdin https://us-central1-docker.pkg.dev >/dev/null 2>&1; docker pull '+quote(image)+' >/dev/null'),token+'\n',300000);
    ssh('sudo install -m 644 /dev/stdin /etc/systemd/system/elevate-studio.service',unit);
    ssh('sudo systemctl daemon-reload && sudo systemctl enable elevate-studio && sudo systemctl restart elevate-studio');
    const proof=`const expected=${JSON.stringify(sha)};let state;for(let n=0;n<60;n++){try{const r=await fetch('http://127.0.0.1:3100/health');state=await r.json();if(r.ok&&state.ready)break;}catch{}await new Promise(r=>setTimeout(r,1000));}if(!state?.ready||state.commit!==expected||!state.providerAuthStorage?.persistent)throw Error('Readiness contract failed');const anonymous=await fetch('http://127.0.0.1:3100/workspace/files');const authorized=await fetch('http://127.0.0.1:3100/workspace/files',{headers:{'x-studio-browser-secret':process.env.STUDIO_BROWSER_SECRET}});if(anonymous.status!==401||!authorized.ok)throw Error('Authorization contract failed');console.log(JSON.stringify({ready:true,commit:state.commit,persistent:true,anonymousDenied:true,authorized:true}));`;
    const verify=()=>JSON.parse(ssh('sudo docker exec -i studio-browser node --input-type=module',proof,90000));
    report.checks.beforeRestart=verify();
    const persistence=`import {ProviderSessionStore} from './provider-session-store.mjs';const store=new ProviderSessionStore({secret:process.env.STUDIO_BROWSER_SECRET,directory:process.env.STUDIO_BROWSER_AUTH_STATE_DIR});const scope='envato:google-isolation-test';await store.save(scope,{storageState:async()=>({cookies:[{name:'isolation-proof',value:'non-secret-restart-marker',domain:'.envato.com'}],origins:[]})});`;
    ssh('sudo docker exec -i studio-browser node --input-type=module',persistence);
    gc(['compute','instances','stop',vm,'--zone='+zone],undefined,180000);
    gc(['compute','instances','start',vm,'--zone='+zone],undefined,180000);
    let restartReady=false;
    for(let attempt=0;attempt<24;attempt++){try{report.checks.afterRestart=verify();restartReady=true;break;}catch{await sleep(10000);}}
    if(!restartReady)throw Error('Browser did not recover after VM restart');
    const restore=`import fs from 'node:fs/promises';import {ProviderSessionStore} from './provider-session-store.mjs';const store=new ProviderSessionStore({secret:process.env.STUDIO_BROWSER_SECRET,directory:process.env.STUDIO_BROWSER_AUTH_STATE_DIR});const scope='envato:google-isolation-test';const state=await store.load(scope);if(state?.cookies?.[0]?.value!=='non-secret-restart-marker')throw Error('Encrypted state lost during restart');await fs.unlink(store.file(scope));console.log('encrypted-persistence-confirmed');`;
    if(ssh('sudo docker exec -i studio-browser node --input-type=module',restore)!=='encrypted-persistence-confirmed')throw Error('Persistence verification failed');
    report.checks.encryptedStateSurvivedVmRestart=true;
    report.passed=true;
  }catch(error){report.passed=false;report.error=error.message;}
  finally{
    try{const current=ownedInstance();if(current&&current.status!=='TERMINATED')gc(['compute','instances','stop',vm,'--zone='+zone],undefined,180000);report.stopped=Boolean(current);}catch{report.stopFailed=true;}
    if(firewallCreated){try{gc(['compute','firewall-rules','delete',firewall]);report.temporarySshRuleRemoved=true;}catch{report.firewallCleanupFailed=true;}}
    writeFileSync(folder+'/trial.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  }
  if(!report.passed||report.stopFailed||report.firewallCleanupFailed)process.exitCode=1;
  return report;
}
export function cleanupTrial(){
  const instance=ownedInstance();
  if(instance&&instance.status!=='TERMINATED')gc(['compute','instances','stop',vm,'--zone='+zone],undefined,180000);
  const runId=process.env.GITHUB_RUN_ID;
  if(!/^\d+$/.test(runId||''))throw Error('GitHub run identifier required');
  const firewall='studio-trial-ssh-'+runId;
  if(json(['compute','firewall-rules','list','--filter=name='+firewall]).some(x=>x.name===firewall))gc(['compute','firewall-rules','delete',firewall]);
  console.log(JSON.stringify({trial:vm,stopped:instance?true:null,temporarySshRuleRemoved:true}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.includes('--cleanup'))cleanupTrial();else await runTrial();
}
