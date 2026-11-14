/**
 * Read-only safety preflight for Cloud Run minimum-instance changes.
 * No mutation occurs. Deliberately refuses to declare Studio safe for scale-to-zero.
 */
import { execFileSync } from 'node:child_process';

const token = execFileSync('gcloud', ['auth', 'print-access-token'], {encoding:'utf8'}).trim();
const project='elegant-racer-299721', region='us-central1';
const names=['elevate-admin-migration','elevate-studio-browser'];
const results=[];
for(const name of names){
  const res=await fetch(`https://run.googleapis.com/v2/projects/${project}/locations/${region}/services/${name}`,{
    headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
  if(!res.ok) throw Error(`Failed to fetch ${name}: HTTP ${res.status}`);
  const data=await res.json();
  const containers=data.template?.containers||[];
  const proposedMin=0;
  const reasons=[];
  if(name==='elevate-admin-migration')
    reasons.push('Admin background task ownership and PARIS callers not yet verified as external to this service.');
  if(name==='elevate-studio-browser')
    reasons.push('CDP browser, terminal and authentication session state currently exist within the container process or local filesystem.');
  const result={
    service:name,currentMin:data.template?.scaling?.minInstanceCount??0,
    currentMax:data.template?.scaling?.maxInstanceCount??null,
    cpu:containers.map(c=>c.resources?.limits?.cpu??null),
    memory:containers.map(c=>c.resources?.limits?.memory??null),
    proposedMin,eligibleForAutomaticChange:reasons.length===0,
    blockers:reasons,
  };
  results.push(result);
  console.log(JSON.stringify(result));
}
if(results.some(r=>r.blockers.length))
  console.log('Preflight result: no scaling mutations permitted. Resolve blockers and verify session persistence before applying changes.');
