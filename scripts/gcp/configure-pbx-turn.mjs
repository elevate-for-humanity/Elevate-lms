import {createHmac,randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {google,loadGoogleConfig,PROJECT} from './runtime-config.mjs';

const zone='us-central1-a',vm='elevate-pbx',tag='elevate-pbx-media';
let phase='inventory';
function execute(command,args,input) {
  const result=spawnSync(command,args,{input,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024});
  if(result.status!==0) throw Error('protected_command_failed');
  return result.stdout.trim();
}
const gc=(args,input)=>google([...args,'--project',PROJECT],input);
function ssh(command,input){
  const result=spawnSync('gcloud',['compute','ssh',vm,'--zone',zone,'--quiet','--command',command,'--project',PROJECT],{input,encoding:'utf8',timeout:240000,maxBuffer:1024*1024});
  if(result.status!==0){
    for(const line of (result.stdout||'').split('\n')){
      try{const report=JSON.parse(line);if(report.relayDiagnostics)console.error(JSON.stringify({relayDiagnostics:report.relayDiagnostics}));if(report.result==='FAIL'&&/^[a-z_]+$/.test(report.reason||''))console.error(JSON.stringify({relayInstallFailure:report.reason,installPhase:/^[a-z_]+$/.test(report.phase||'')?report.phase:'unknown'}));}catch{}
    }
    throw Error('protected_ssh_operation_failed');
  }
  return result.stdout.trim();
}
function rule(name,allowed,sources,network){
  const all=JSON.parse(gc(['compute','firewall-rules','list','--filter',`name=${name}`,'--format=json']));
  if(all.length){
    const value=all[0];
    const normalize=x=>JSON.stringify([...x].sort());
    const ports=(value.allowed||[]).flatMap(a=>(a.ports||[]).map(p=>a.IPProtocol+':'+p));
    if(all.length!==1 || value.disabled || value.direction!=='INGRESS' || value.network!==network || normalize(value.targetTags||[])!==normalize([tag]) || normalize(value.sourceRanges||[])!==normalize(sources) || normalize(ports)!==normalize(allowed)) throw Error('existing_relay_firewall_requires_review');
  } else gc(['compute','firewall-rules','create',name,'--network',network,'--direction=INGRESS','--action=ALLOW','--rules',allowed.join(','),'--source-ranges',sources.join(','),'--target-tags',tag,'--quiet']);
}

async function main(){
  const instance=JSON.parse(gc(['compute','instances','describe',vm,'--zone',zone,'--format=json']));
  const nic=instance.networkInterfaces?.[0];
  if(instance.status!=='RUNNING'||nic?.accessConfigs?.[0]?.natIP!=='107.178.216.162'||!/^10\.\d+\.\d+\.\d+$/.test(nic.networkIP))throw Error('owned_pbx_identity_mismatch');
  const configs=['admin','lms'].map(component=>loadGoogleConfig(component));
  const existing=[...new Set(configs.map(c=>c.runtimeEnvironment.PBX_TURN_SHARED_SECRET).filter(Boolean))];
  if(existing.length>1||existing.some(s=>!/^[a-f0-9]{64}$/.test(s)))throw Error('existing_relay_credentials_require_review');
  phase='encrypted_relay_identity';
  const secretName='elevate-pbx-turn-shared-secret';
  const secrets=JSON.parse(gc(['secrets','list','--filter',`name:/${secretName}`,'--format=json']));
  const stored=secrets.find(s=>s.name.split('/').at(-1)===secretName);
  if(stored&&stored.labels?.elevate_component!=='pbx')throw Error('relay_secret_ownership_requires_review');
  let secret;
  if(stored){
    secret=gc(['secrets','versions','access','latest','--secret',secretName]);
    if(!/^[a-f0-9]{64}$/.test(secret)||existing.some(s=>s!==secret))throw Error('existing_relay_identity_requires_review');
  }else{
    secret=existing[0]||randomBytes(32).toString('hex');
    gc(['secrets','create',secretName,'--replication-policy=automatic','--labels=elevate_component=pbx','--quiet']);
    gc(['secrets','versions','add',secretName,'--data-file=-','--format=value(name)'],secret);
  }
  phase='official_image';
  execute('docker',['pull','coturn/coturn:4.18.0-r0']);
  const image=JSON.parse(execute('docker',['image','inspect','coturn/coturn:4.18.0-r0']))[0].RepoDigests.find(d=>/^coturn\/coturn@sha256:[a-f0-9]{64}$/.test(d));
  if(!image)throw Error('official_image_digest_missing');
  phase='relay_install';
  ssh('sudo install -m 600 /dev/stdin /etc/elevate-pbx/managed-turn.py',readFileSync(new URL('./configure-pbx-turn.py',import.meta.url),'utf8'));
  const installed=JSON.parse(ssh('sudo python3 /etc/elevate-pbx/managed-turn.py',JSON.stringify({image,secret,privateIp:nic.networkIP})));
  if(!installed.relayInstalled||!installed.pbxContainerPreserved)throw Error('relay_install_not_verified');
  phase='relay_firewall';
  gc(['compute','instances','add-tags',vm,'--zone',zone,'--tags',tag,'--quiet']);
  rule('elevate-pbx-authenticated-turn',['tcp:3478','udp:3478'],['0.0.0.0/0'],nic.network);
  rule('elevate-pbx-owned-turn-peers',['udp:49160-49259'],['107.178.216.162/32',nic.networkIP+'/32'],nic.network);
  phase='external_media_test';
  const username=`${Math.floor(Date.now()/1000)+180}:deployment-probe`;
  const password=createHmac('sha1',secret).update(username).digest('base64');
  const evidence=[];
  for(const transport of ['udp','tcp']){
    const args=['run','--rm','--network=host','--entrypoint','turnutils_uclient',image,'-y','-c','-m','1','-n','10','-u',username,'-w',password,'-p','3478'];
    if(transport==='tcp')args.push('-t');
    args.push('107.178.216.162');
    const result=execute('docker',args);
    const received=[...result.matchAll(/(?:tot_recv_msgs|recv_msgs)\s*[=:]\s*(\d+)/g)].map(m=>Number(m[1]));
    if(!received.some(n=>n>0)||/Total lost packets\s+\d+\s*\(100/.test(result))throw Error('external_authenticated_media_not_verified');
    evidence.push({transport,receivedMessages:Math.max(...received)});
  }
  phase='encrypted_app_configuration';
  for(const component of ['admin','lms']){
    const name=`elevate-${component}-runtime-config`;
    const version=()=>gc(['secrets','versions','describe','latest','--secret',name,'--format=value(name)']);
    const before=version(),config=loadGoogleConfig(component);
    const env=config.runtimeEnvironment;
    if(env.PBX_TURN_SHARED_SECRET&&env.PBX_TURN_SHARED_SECRET!==secret)throw Error('relay_binding_changed_concurrently');
    env.PBX_TURN_SHARED_SECRET=secret;
    env.PBX_TURN_URLS='turn:phone.elevateforhumanity.org:3478?transport=udp,turn:phone.elevateforhumanity.org:3478?transport=tcp';
    if(version()!==before)throw Error('app_configuration_changed_concurrently');
    gc(['secrets','versions','add',name,'--data-file=-','--format=value(name)'],JSON.stringify(config));
  }
  console.log(JSON.stringify({result:'PASS',...installed,image,externalRelayTests:evidence,appConfigurationSaved:true,liveAppBindingPending:true,telephoneCallsPlaced:0}));
}
main().catch(()=>{console.error(JSON.stringify({result:'FAIL',phase,credentialsEmitted:false}));process.exitCode=1;});
