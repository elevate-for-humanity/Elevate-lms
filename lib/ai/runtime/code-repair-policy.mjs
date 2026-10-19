export const REPAIR_REPOSITORY='elevate-for-humanity/Elevate-lms';
export const REPAIR_WORKFLOW='paris-code-repair.yml';
export function repairFingerprint(operation,category,sha){return `${operation}:${category}:${sha}`;}
export function eligibleRepairEvents(events){
 const grouped=new Map();
 for(const e of events){
  if(!grouped.has(e.operation))grouped.set(e.operation,[]);
  grouped.get(e.operation).push(e);
 }
 return [...grouped.values()].flatMap(rows=>{
  rows.sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));
  if(rows[0].status!=='failed')return [];
  const failures=rows.filter(e=>e.status==='failed'&&['quality','unknown'].includes(e.failure_category));
  return failures.length>=3?[failures[0]]:[];
 });
}
export function validationPassed(jobs){
 return jobs.some(j=>j.name==='validate'&&j.status==='completed'&&j.conclusion==='success');
}
export function repairDeploymentState(runs,sha){
 const names=['Deploy Admin','Deploy LMS automatically on Google','Deploy Google Marketing on trigger','Deploy Google Course Builder on source changes'];
 const exact=runs.filter(r=>r.head_sha===sha&&names.includes(r.name));
 if(!exact.length)return 'pending';
 // A successful dispatch-only wrapper is not deployment evidence.
 const dispatched=exact.filter(r=>r.event==='workflow_dispatch'||r.name==='Deploy Google Course Builder on source changes');
 if(dispatched.some(r=>r.status==='completed'&&r.conclusion!=='success'))return 'failed';
 return names.every(name=>dispatched.some(r=>r.name===name&&r.status==='completed'&&r.conclusion==='success'))?'passed':'pending';
}

export function canRetryRepair(repair){return repair.status==='blocked'&&repair.attempt_count<2&&!repair.release_sha&&((Boolean(repair.candidate?.branch?.sha)&&/PATCH_OR_VALIDATION_FAILED|REPAIR_WORKFLOW_failure/.test(repair.error_code??''))||(!repair.candidate?.branch?.sha&&/^(REPAIR_DISPATCH_FAILED|REPAIR_DISPATCH_NOT_CLAIMED)$/.test(repair.error_code??'')));}

export const REPAIR_DEPLOYMENTS=[
 {name:'Deploy Admin',workflow:'deploy-admin.yml'},
 {name:'Deploy LMS automatically on Google',workflow:'deploy-google-lms-trigger.yml'},
 {name:'Deploy Google Marketing on trigger',workflow:'deploy-google-marketing-trigger.yml'},
 {name:'Deploy Google Course Builder on source changes',workflow:'deploy-google-course-worker.yml'},
];
/** One release at a time; accepted dispatches remain pending until observed. */
export function nextRepairDeployment(runs,sha,requested=[]) {
 for(const deployment of REPAIR_DEPLOYMENTS){
  const exact=runs.filter(run=>run.head_sha===sha&&run.name===deployment.name&&run.event==='workflow_dispatch');
  if(exact.some(run=>run.status==='completed'&&run.conclusion==='success'))continue;
  if(exact.length||requested.includes(deployment.workflow))return null;
  return deployment.workflow;
 }
 return null;
}

/**
 * Worker generations are transient; the build and unresolved defect are durable.
 * A replacement job must not erase a code repair while the same failure persists.
 * Never repair a published/archived build or a resolved defect.
 */
export function courseDefectDisposition({source,latest,build}) {
 if (!source || !latest || !build || source.build_id !== latest.build_id || build.id !== source.build_id)
  return 'blocked';
 if (['published','archived'].includes(build.status) || build.profile?.ownerPaused === true)
  return 'blocked';
 if (latest.id === source.id && latest.status === 'failed') return 'repair';
 const text = String(source.last_error ?? '');
 const findings = Array.isArray(build.findings) ? build.findings : [];
 const unresolved = findings.some(f => {
  const candidate=String(f?.code ?? '')+' '+String(f?.message ?? '');
  return /RENDER_FAILED|QUALITY|CUE_NOT_ALIGNED|NARRATION_MISMATCH|MEDIA_SCENE|frozen|replay|visual changes/i.test(candidate);
 });
 if (!unresolved) return 'resolved';
 if (latest.status === 'completed') return 'resolved';
 return ['running','queued','failed'].includes(latest.status) && /quality|render|cue|speech|narration|replay|timeline/i.test(text)
  ? 'repair' : 'blocked';
}
