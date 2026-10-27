import { spawnSync } from 'node:child_process';

const PROJECT='elegant-racer-299721';
const ZONE=process.env.GOOGLE_STUDIO_ZONE || 'us-central1-a';
const VM='elevate-studio-browser';
const DISK='elevate-studio-browser-auth';
const IMAGE_SHA=process.env.IMAGE_SHA;
if(!/^[a-f0-9]{40}$/.test(IMAGE_SHA||'')) throw new Error('Full Studio image SHA required');

function gcloud(args){
  const r=spawnSync('gcloud',args,{encoding:'utf8',maxBuffer:4*1024*1024});
  if(r.status!==0) throw new Error('Google Studio operation failed: '+args.slice(0,3).join(' '));
  return r.stdout.trim();
}
const image='us-central1-docker.pkg.dev/'+PROJECT+'/elevate/studio-browser:'+IMAGE_SHA;
const digest=gcloud(['artifacts','docker','images','describe',image,'--project',PROJECT,'--format=value(image_summary.digest)']);
if(!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Studio image digest unavailable');

const disks=gcloud(['compute','disks','list','--project',PROJECT,'--filter=name='+DISK,'--format=value(name)']);
if(!disks) gcloud(['compute','disks','create',DISK,'--project',PROJECT,'--zone',ZONE,'--size=10GB','--type=pd-balanced']);

const metadata=[
  'google-logging-enabled=true',
  'google-monitoring-enabled=true',
  'container-image='+image+'@'+digest,
  'container-port=3100',
  'container-mount=/var/lib/studio-browser-auth',
].join(',');
const existing=gcloud(['compute','instances','list','--project',PROJECT,'--filter=name='+VM,'--format=value(name)']);
if(!existing){
  gcloud(['compute','instances','create-with-container',VM,'--project',PROJECT,'--zone',ZONE,
    '--machine-type=e2-standard-2','--container-image='+image+'@'+digest,
    '--disk=name='+DISK+',device-name='+DISK+',mode=rw,boot=no,auto-delete=no',
    '--container-mount-disk=mount-path=/var/lib/studio-browser-auth,name='+DISK,
    '--service-account=elevate-admin-runtime@'+PROJECT+'.iam.gserviceaccount.com',
    '--scopes=https://www.googleapis.com/auth/cloud-platform',
    '--tags=elevate-studio-browser','--metadata='+metadata,'--quiet']);
}else{
  gcloud(['compute','instances','update-container',VM,'--project',PROJECT,'--zone',ZONE,
    '--container-image='+image+'@'+digest,'--quiet']);
}
console.log('Google Studio runtime reconciled with durable auth disk. Source auth-state copy must be verified before cutover.');
