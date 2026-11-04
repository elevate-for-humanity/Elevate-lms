#!/usr/bin/env node
/**
 * PARIS operational incident routing. This never dispatches work, changes an
 * approval, approves licensing, changes job states, or calls the repair API.
 * Existing owner-authorized paris-code-repair.yml remains the execution path.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function routeIncident(alert, row={}){
 const code=String(row.last_error??'').slice(0,500);
 if(alert.type==='completed')return {route:'verification',reason:'Job completed; verify output, learner playback and canonical release',automaticMutation:false};
 if(alert.type==='completed_reversal')return {route:'investigate',reason:'Completed job reentered execution; audit authorization and generation',automaticMutation:false};
 if(alert.type==='stale_worker')return {route:'operator',reason:'Lease and heartbeat evidence must be reconciled before any worker action',automaticMutation:false};
 if(alert.type==='overdue_queue')return {route:'operator',reason:'Inspect owner pause, prerequisites, capacity and attempts before recovery',automaticMutation:false};
 if(/LICENSE|RELEVANCE|VISUAL_ACQUISITION|COPYRIGHT/i.test(code))
   return {route:'licensed-assets',reason:'Licensed and relevant visual evidence required',automaticMutation:false};
 if(/HTTP.?401|AUTH|PERMISSION|SIGNED_URL/i.test(code))
   return {route:'credentials',reason:'Check scoped access and expiry without exposing or rewriting secrets',automaticMutation:false};
 if(/CHECKPOINT|QUALITY|NARRATION|SCENE|RENDER|PATCH_FAILED/i.test(code))
   return {route:'paris-review',reason:'Candidate for existing owner-authorized PARIS repair workflow with new regression tests',automaticMutation:false};
 return {route:'triage',reason:'Collect exact failure context and confirm affected component',automaticMutation:false};
}

export function buildIncidentReport(snapshot,probes){
 if(snapshot?.source!=='verified-runtime-readonly'||!Array.isArray(snapshot?.diagnostics?.alerts))
   throw Error('VERIFIED_JOB_EVIDENCE_REQUIRED');
 const byId=snapshot.diagnostics.byId??{};
 const items=snapshot.diagnostics.alerts.map(alert=>({
   type:alert.type,jobId:alert.jobId,
   ...routeIncident(alert,byId[alert.jobId])
 }));
 const surfaceIncidents=(probes?.results??[]).filter(s=>s.healthy===false).map(s=>({
   type:'surface_unreachable',surface:s.name,route:'operator',
   reason:'Check deployed service and routing; reachability alone is not user acceptance',
   automaticMutation:false
 }));
 return {generatedAt:new Date().toISOString(),sourceCapturedAt:snapshot.capturedAt,
   incidents:[...items,...surfaceIncidents],
   detectedCount:items.length+surfaceIncidents.length,
   existingRepairWorkflow:'paris-code-repair.yml',
   dispatchAuthorized:false,
   noAutomaticChanges:['student-hours','financial-records','publication','worker-leases',
     'owner-pauses','retry-ceilings','licensing','production-deploy']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try {
   const jobs=JSON.parse(readFileSync(process.argv[2],'utf8'));
   let probes=null;
   if(process.argv[3])probes=JSON.parse(readFileSync(process.argv[3],'utf8'));
   const report=buildIncidentReport(jobs,probes);
   mkdirSync('audit-output',{recursive:true});
   writeFileSync('audit-output/paris-incident-triage.json',JSON.stringify(report,null,2));
   console.log(JSON.stringify({detectedCount:report.detectedCount,incidents:report.incidents}));
 }catch(error){console.error('PARIS_TRIAGE_FAILED:'+String(error.message).slice(0,100));process.exitCode=2;}
}
