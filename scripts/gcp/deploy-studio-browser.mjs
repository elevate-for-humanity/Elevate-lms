// Studio Browser VM reconcile.
//
// Google discontinued the gcloud container-VM commands (the container
// startup agent / Konlet path): production dispatch run 45979546074 failed
// at instance creation with "The option to deploy a container during VM
// instance creation that relies on a container startup agent is
// discontinued." The supported replacement (per
// scripts/gcp/GOOGLE_OWNERSHIP.md: "supported VM startup/systemd") is a
// Container-Optimized OS VM whose metadata startup script mounts the durable
// auth disk and installs a systemd unit that runs the pinned image under
// Docker — the same shape as the proven scripts/gcp/deploy-studio-vm-trial.mjs
// unit. The reconcile contract is unchanged: same VM, zone, machine type,
// service account, scopes, tag, durable auth disk (never auto-deleted,
// formatted only when it carries no filesystem), container on port 3100 with
// the auth state bind-mounted at /var/lib/studio-browser-auth, image pinned
// by digest.
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PROJECT='elegant-racer-299721';
const ZONE=process.env.GOOGLE_STUDIO_ZONE || 'us-central1-a';
const VM='elevate-studio-browser';
const DISK='elevate-studio-browser-auth';
const IMAGE_SHA=process.env.IMAGE_SHA;
if(!/^[a-f0-9]{40}$/.test(IMAGE_SHA||'')) throw new Error('Full Studio image SHA required');

function gcloud(args){
  const r=spawnSync('gcloud',args,{encoding:'utf8',maxBuffer:4*1024*1024});
  if(r.status!==0){
    const output=((r.stderr||r.stdout||'').trim().slice(-2000));
    const detail=[r.error&&('spawn error: '+r.error.message),output].filter(Boolean).join(' :: ') || 'no gcloud output';
    throw new Error('Google Studio operation failed: '+args.slice(0,3).join(' ')+' :: '+detail);
  }
  return r.stdout.trim();
}
const image='us-central1-docker.pkg.dev/'+PROJECT+'/elevate/studio-browser:'+IMAGE_SHA;
const digest=gcloud(['artifacts','docker','images','describe',image,'--project',PROJECT,'--format=value(image_summary.digest)']);
if(!/^sha256:[a-f0-9]{64}$/.test(digest)) throw new Error('Studio image digest unavailable');
const imageRef=image+'@'+digest;

// The startup script is idempotent: every boot re-mounts the auth disk,
// rewrites the unit for the pinned image, refreshes the local image, and
// (re)starts the service. An image update is therefore metadata + reset.
function startupScript(){
  return `#!/bin/bash
set -euo pipefail
export HOME=/var/lib/studio-runtime-home
install -d -m 755 "$HOME" /var/lib/studio-browser-auth
device=/dev/disk/by-id/google-${DISK}
for i in $(seq 1 30); do [ -b "$device" ] && break; sleep 2; done
test -b "$device"
kind=$(blkid -p -o value -s TYPE "$device" || true)
if [ -z "$kind" ]; then
  test -z "$(wipefs -n --noheadings -o TYPE "$device" || true)"
  mkfs.ext4 -m 0 -F "$device"
elif [ "$kind" != "ext4" ]; then
  echo "Refusing to mount auth disk with filesystem: $kind" >&2; exit 1
fi
uuid=$(blkid -s UUID -o value "$device")
test -n "$uuid"
if ! grep -q "UUID=$uuid " /etc/fstab 2>/dev/null; then
  printf 'UUID=%s /var/lib/studio-browser-auth ext4 defaults 0 2\\n' "$uuid" >> /etc/fstab || true
fi
mountpoint -q /var/lib/studio-browser-auth || mount /var/lib/studio-browser-auth
chown 1001:1001 /var/lib/studio-browser-auth
chmod 700 /var/lib/studio-browser-auth
systemctl enable --now docker.service || true
token=$(curl -sf -H 'Metadata-Flavor: Google' 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' | sed -n 's/.*"access_token" *: *"\\([^"]*\\)".*/\\1/p')
test -n "$token"
printf '%s' "$token" | docker login -u oauth2accesstoken --password-stdin us-central1-docker.pkg.dev >/dev/null
docker pull '${imageRef}'
cat > /etc/systemd/system/studio-browser.service <<'UNIT'
[Unit]
Description=Elevate Studio browser
Requires=docker.service
After=docker.service network-online.target
RequiresMountsFor=/var/lib/studio-browser-auth
[Service]
Restart=always
RestartSec=5
TimeoutStartSec=300
TimeoutStopSec=45
ExecStartPre=-/usr/bin/docker rm studio-browser
ExecStart=/usr/bin/docker run --name studio-browser --init --shm-size=1g --pids-limit=512 --cap-drop=ALL --security-opt=no-new-privileges --log-opt=max-size=10m --log-opt=max-file=3 --publish=3100:3100 --mount=type=bind,src=/var/lib/studio-browser-auth,dst=/var/lib/studio-browser-auth ${imageRef}
ExecStop=/usr/bin/docker stop --time=30 studio-browser
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable studio-browser.service
systemctl restart studio-browser.service
`;
}

const disks=gcloud(['compute','disks','list','--project',PROJECT,'--filter=name='+DISK,'--format=value(name)']);
if(!disks) gcloud(['compute','disks','create',DISK,'--project',PROJECT,'--zone',ZONE,'--size=10GB','--type=pd-balanced']);

const scriptFile=join(tmpdir(),'elevate-studio-startup.sh');
writeFileSync(scriptFile,startupScript(),{mode:0o755});
try{
  const existing=gcloud(['compute','instances','list','--project',PROJECT,'--filter=name='+VM,'--format=value(name)']);
  if(!existing){
    gcloud(['compute','instances','create',VM,'--project',PROJECT,'--zone',ZONE,
      '--machine-type=e2-standard-2',
      '--image-family=cos-stable','--image-project=cos-cloud','--boot-disk-size=20GB',
      '--disk=name='+DISK+',device-name='+DISK+',mode=rw,boot=no,auto-delete=no',
      '--service-account=elevate-admin-runtime@'+PROJECT+'.iam.gserviceaccount.com',
      '--scopes=https://www.googleapis.com/auth/cloud-platform',
      '--tags=elevate-studio-browser',
      '--metadata=google-logging-enabled=true,google-monitoring-enabled=true',
      '--metadata-from-file=startup-script='+scriptFile,'--quiet']);
  }else{
    gcloud(['compute','instances','add-metadata',VM,'--project',PROJECT,'--zone',ZONE,
      '--metadata-from-file=startup-script='+scriptFile,'--quiet']);
    gcloud(['compute','instances','reset',VM,'--project',PROJECT,'--zone',ZONE,'--quiet']);
  }
}finally{
  rmSync(scriptFile,{force:true});
}
console.log('Google Studio runtime reconciled with durable auth disk (startup-script + systemd; Konlet retired). Source auth-state copy must be verified before cutover.');
