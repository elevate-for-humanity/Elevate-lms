#!/usr/bin/env node
// Static coverage of every currently checked-in workflow, including ones
// that did not run. No production writes, restarts or GitHub API mutations.
import {readdirSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const folder='.github/workflows';
export function inspectWorkflow(name,source){
 const active=source.replace(/^\s*#.*$/gm,'');
 const jobsPart=active.split(/^jobs:\s*$/m)[1]??'';
 const jobBlocks=jobsPart.split(/(?=^  [A-Za-z0-9_-]+:\s*$)/gm);
 const jobs=jobBlocks.map(block=>{
  const name=block.match(/^  ([A-Za-z0-9_-]+):/m)?.[1];
  // Only a four-space job-level condition restricts a scheduled job.
  // Step-level conditions do not prevent the job itself from starting.
  const match=block.match(/^    if:\s*(.*)$/m);
  const condition=match?block.slice(block.indexOf(match[0]))
    .split(/\n    [A-Za-z][A-Za-z_-]*:/)[0]:'';
  return {name,hasConditional:Boolean(match),condition};
 }).filter(j=>j.name);
 const scheduled=[...active.matchAll(/^\s*- cron:\s*['"]([^'"]+)['"]/gm)].map(x=>x[1]);
 const conditions=jobs.map(j=>j.condition).join('\n');
 const scheduledUsed=[...conditions.matchAll(/github\.event\.schedule\s*==\s*['"]([^'"]+)['"]/g)].map(x=>x[1]);
 const coversAllSchedules=jobs.some(job=>!job.hasConditional ||
  (/(?:github\.event_name\s*==\s*['"]schedule['"]|always\(\))/.test(job.condition) &&
   !/github\.event\.schedule\s*==/.test(job.condition)));
 const findings=[];
 for(const cron of scheduled)if(!coversAllSchedules&&!scheduledUsed.includes(cron))
  findings.push({code:'ORPHAN_CRON',detail:cron,severity:'high'});
 for(const [i,line] of active.split('\n').entries()){
  if(/^\s*if:\s*.*&&\s*false(?:\b|[)]|$)/.test(line))
   findings.push({code:'PERMANENTLY_SKIPPED_JOB',line:i+1,detail:line.trim(),severity:'high'});
  if(/head_sha\s*==\s*['"][a-f0-9]{40}['"]/.test(line))
   findings.push({code:'HISTORICAL_SHA_GATE',line:i+1,detail:line.trim(),severity:'high'});
  if(/startsWith\(github\.head_ref,\s*['"]release\/production-recovery-/.test(line))
   findings.push({code:'SPECIAL_RECOVERY_BRANCH',line:i+1,detail:line.trim(),severity:'high'});
 }
 const num=jobs.length;
 return {name,job_count:num,scheduled,scheduledUsed,findings,
  hasManualDispatch:/^\s*workflow_dispatch:\s*$/m.test(active),
  hasWorkflowRun:/^\s*workflow_run:\s*$/m.test(active),
  hasPush:/^\s*push:\s*$/m.test(active),
  hasPR:/^\s*pull_request:\s*$/m.test(active),
  hasScheduled:scheduleExists(active)};
}
function scheduleExists(s){return /^\s*schedule:\s*$/m.test(s);}
export function auditWorkflowSources({directory=folder}={}){
 const files=readdirSync(directory).filter(f=>/\.ya?ml$/i.test(f)).sort();
 const rows=files.map(f=>inspectWorkflow(f,readFileSync(join(directory,f),'utf8')));
 return {files:rows.length,jobs:rows.reduce((n,r)=>n+r.job_count,0),
  findings:rows.flatMap(r=>r.findings.map(f=>({...f,workflow:r.name}))),
  workflows:rows};
}
export function summarize(result){
 return '# All current GitHub Actions workflow gates\n\nFiles: '+result.files+
  '. Jobs: '+result.jobs+'. Findings: '+result.findings.length+'.\n\n'+
  'Historical run conclusions are audited separately; source findings do not prove a particular production job executed.\n\n'+
  '| Workflow | Finding | Severity | Detail |\n|---|---|---|---|\n'+
  result.findings.map(f=>'| '+f.workflow+' | '+f.code+' | '+f.severity+' | '+
   String(f.detail??'').replaceAll('|','/').replaceAll('\n',' ')+' |').join('\n')+'\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const result=auditWorkflowSources();
 mkdirSync('audit-output',{recursive:true});
 writeFileSync('audit-output/workflow-source-gates.json',JSON.stringify(result,null,2));
 writeFileSync('audit-output/workflow-source-gates.md',summarize(result));
 console.log(JSON.stringify({files:result.files,jobs:result.jobs,findings:result.findings.length,
  high:result.findings.filter(f=>f.severity==='high').length}));
}
