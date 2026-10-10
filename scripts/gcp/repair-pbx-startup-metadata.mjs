import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PROJECT = 'elegant-racer-299721';
const ZONE = 'us-central1-a';
const VM = 'elevate-pbx';
const API = `https://compute.googleapis.com/compute/v1/projects/${PROJECT}`;
const INSTANCE = `${API}/zones/${ZONE}/instances/${VM}`;
// Exact repository bootstrap before preservation; no arbitrary script replacement.
// Rollback source: e586835f6386fae8143d8e8b42d2ce06856b56d9:infra/pbx/google-startup.sh
export const LEGACY_SHA256 = '5260f33b417d1b8019253713bec039038f5b6f7ea43f5a676d99175f84ef93a4';
export const digest = value => createHash('sha256').update(value).digest('hex');

export function planUpdate(instance, project, replacement, legacyHash = LEGACY_SHA256) {
  const zones = [`${API}/zones/${ZONE}`,`https://www.googleapis.com/compute/v1/projects/${PROJECT}/zones/${ZONE}`];
  if (instance.name !== VM || !zones.includes(instance.zone) ||
      instance.status !== 'RUNNING' || !instance.id || !instance.lastStartTimestamp ||
      instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP !== '107.178.216.162') {
    throw new Error('vm_identity_or_state_mismatch');
  }
  const items = instance.metadata?.items || [];
  const projectItems = project.commonInstanceMetadata?.items || [];
  if ([...items,...projectItems].some(item => item.key === 'startup-script-url')) {
    throw new Error('additional_startup_script_requires_review');
  }
  const scripts = items.filter(item => item.key === 'startup-script');
  if (scripts.length !== 1 || !instance.metadata?.fingerprint || !replacement.startsWith('#!/bin/bash\n')) {
    throw new Error('startup_metadata_requires_review');
  }
  const beforeHash = digest(scripts[0].value);
  const afterHash = digest(replacement);
  if (beforeHash === afterHash) return { beforeHash,afterHash,changed:false };
  if (beforeHash !== legacyHash) throw new Error('unrecognized_startup_script_preserved');
  return { beforeHash,afterHash,changed:true,metadata: {
    fingerprint:instance.metadata.fingerprint,
    items:items.map(item => item.key === 'startup-script' ? {...item,value:replacement} : item),
  } };
}

export async function repair(request, replacement) {
  const [before,project] = await Promise.all([request(INSTANCE),request(API)]);
  const plan = planUpdate(before,project,replacement);
  if (plan.changed) {
    // Compute's fingerprint rejects concurrent metadata edits. Do not retry a 412.
    const operation = await request(`${INSTANCE}/setMetadata`, { method:'POST',body:JSON.stringify(plan.metadata) });
    if (!/^[a-zA-Z0-9-]+$/.test(operation.name || '')) throw new Error('metadata_operation_unverified');
    let complete = false;
    for (let attempt=0;attempt<20;attempt++) {
      const state = await request(`${API}/zones/${ZONE}/operations/${operation.name}/wait`, { method:'POST' });
      if (state.error) throw new Error('metadata_operation_failed');
      if (state.status === 'DONE') { complete=true;break; }
    }
    if (!complete) throw new Error('metadata_operation_timeout');
  }
  const after = await request(INSTANCE);
  const verified = planUpdate(after,project,replacement);
  if (verified.changed || after.id !== before.id || after.lastStartTimestamp !== before.lastStartTimestamp) {
    throw new Error('metadata_or_vm_continuity_unverified');
  }
  const other = data => JSON.stringify((data.metadata.items || []).filter(item=>item.key!=='startup-script').sort((a,b)=>a.key.localeCompare(b.key)));
  if (other(before) !== other(after)) throw new Error('unrelated_metadata_changed_requires_review');
  return { result:'PASS',project:PROJECT,zone:ZONE,vm:VM,changed:plan.changed,
    beforeSha256:plan.beforeHash,afterSha256:plan.afterHash,
    vmIdentityUnchanged:true,lastStartTimestampUnchanged:true,unrelatedMetadataUnchanged:true,
    observedAt:new Date().toISOString(),rebootAcceptance:'NOT TESTED' };
}

async function main() {
  const replacement = readFileSync('infra/pbx/google-startup.sh','utf8');
  // The token remains in memory. Never emit process output, metadata or error bodies.
  const token = execFileSync('gcloud',['auth','print-access-token'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const request = async (url,init={}) => {
    const response = await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
      redirect:'error',signal:AbortSignal.timeout(35000)});
    if (!response.ok) throw new Error(`google_http_${response.status}`);
    return response.json();
  };
  const evidence = await repair(request,replacement);
  writeFileSync('pbx-startup-preservation-evidence.json',JSON.stringify(evidence,null,2));
  console.log(JSON.stringify(evidence));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    // Only our fixed outcome codes may be logged; never SDK/process exceptions.
    const code = /^[a-z_0-9]+$/.test(error?.message || '') ? error.message : 'startup_preservation_unavailable';
    const evidence = {result:'BLOCKED',code,observedAt:new Date().toISOString()};
    writeFileSync('pbx-startup-preservation-evidence.json',JSON.stringify(evidence));
    console.error(JSON.stringify(evidence)); process.exitCode=1;
  });
}
