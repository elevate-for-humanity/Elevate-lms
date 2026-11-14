#!/usr/bin/env node
/**
 * Generate NONSECRET PBX systemd EnvironmentFile inputs in a local, private
 * directory. Does not touch the VM, Asterisk, Telnyx, or any production route.
 * Usage:
 * node scripts/gcp/prepare-pbx-environment.mjs --out /tmp/pbx-config-private \\
 *   --phone-system-id UUID --asterisk-container NAME --asterisk-gid NUMBER \\
 *   --generated-root /path/to/reviewed/host/asterisk/config/elevate-webrtc
 *
 * All four PBX Secret Manager secrets must already contain an ENABLED version.
 * Google credentials/VM service account access must be established separately.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, dirname, isAbsolute } from 'node:path';
const project='elegant-racer-299721';
const secretNames={
  ari:'elevate-paris-ari-password',
  turn:'elevate-paris-turn-token',
  provisioning:'elevate-pbx-provisioning-token',
  supabase:'elevate-pbx-supabase-service-role'
};
function fail(message){throw new Error('PBX_CONFIG_BLOCKED: '+message);}
function argumentsMap(args){
  const result={};
  for(let i=0;i<args.length;i+=2){
    if(!args[i]?.startsWith('--')||!args[i+1]||args[i+1].startsWith('--'))fail('expected --key value arguments');
    const key=args[i].slice(2);
    if(result[key])fail('duplicate '+key);
    result[key]=args[i+1];
  }
  return result;
}
export function renderConfigs(values, versions){
  if(!/^[0-9a-f-]{36}$/i.test(values['phone-system-id']||''))fail('phone system UUID required');
  if(!/^[A-Za-z][A-Za-z0-9_.-]{1,79}$/.test(values['asterisk-container']||''))fail('container name unverified');
  if(!/^[1-9][0-9]{0,7}$/.test(values['asterisk-gid']||''))fail('numeric Asterisk GID required');
  const root=values['generated-root']||'';
  if(!isAbsolute(root)||root.includes('..')||/\s/.test(root)||!root.endsWith('/elevate-webrtc'))fail('reviewed absolute generated root required');
  const refs=Object.fromEntries(Object.entries(secretNames).map(([key,name])=>{
    const version=versions[key];
    if(!/^[1-9][0-9]*$/.test(String(version||'')))fail('enabled pinned version missing: '+name);
    return [key,'projects/'+project+'/secrets/'+name+'/versions/'+version];
  }));
  return {
    'paris.conf':[
      'PARIS_ARI_USER=elevate-paris',
      'PARIS_ARI_PASSWORD_SECRET='+refs.ari,
      'PARIS_TURN_TOKEN_SECRET='+refs.turn,
      'PARIS_TURN_URL=https://phone.elevateforhumanity.org/internal/paris/turn'
    ].join('\n')+'\n',
    'provisioner.conf':[
      'PBX_PROVISIONING_TOKEN_SECRET='+refs.provisioning,
      'SUPABASE_SERVICE_ROLE_KEY_SECRET='+refs.supabase,
      'SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co',
      'PBX_PHONE_SYSTEM_ID='+values['phone-system-id'],
      'PBX_ASTERISK_CONTAINER='+values['asterisk-container'],
      'PBX_ASTERISK_GID='+values['asterisk-gid'],
      'PBX_GENERATED_ROOT='+root
    ].join('\n')+'\n'
  };
}
async function main(){
  const args=argumentsMap(process.argv.slice(2));
  if(!args.out||!isAbsolute(args.out))fail('absolute --out required');
  // Refuse symlink targets or pre-existing files; no overwrites.
  let dir;
  try{dir=lstatSync(args.out); }catch(e){if(e.code!=='ENOENT')throw e;}
  if(dir)fail('output directory already exists; choose new private path');
  const versions={};
  for(const [key,name] of Object.entries(secretNames)){
    const output=execFileSync('gcloud',['secrets','versions','list',name,'--project='+project,'--filter=state=ENABLED','--sort-by=~createTime','--limit=1','--format=value(name)'],{encoding:'utf8',timeout:30000}).trim();
    const version=output.split('/').at(-1);
    if(!/^[1-9][0-9]*$/.test(version||''))fail('missing enabled version for '+name);
    versions[key]=version;
  }
  const config=renderConfigs(args,versions);
  mkdirSync(args.out,{recursive:false,mode:0o700});
  if(lstatSync(args.out).isSymbolicLink()||realpathSync(args.out)!==resolve(args.out))fail('unsafe output path');
  for(const [name,value] of Object.entries(config))writeFileSync(resolve(args.out,name),value,{encoding:'utf8',mode:0o600,flag:'wx'});
  process.stdout.write('PASS: generated nonsecret, pinned Secret Manager references in private directory. No VM changes.\n');
  process.stdout.write('NEXT: confirm live Asterisk mounts, service account access, Caddy routes, approved phone-system ID, operator/voicemail; then install reviewed files as root under /etc/elevate-pbx. Do not activate existing Telnyx routes.\n');
}
if(process.argv[1] && import.meta.url===new URL('file://'+resolve(process.argv[1])).href)main().catch(e=>{console.error(String(e.message).replace(/\n/g,' '));process.exitCode=1;});
