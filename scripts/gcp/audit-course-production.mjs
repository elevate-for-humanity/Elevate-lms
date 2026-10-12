import {pathToFileURL} from 'node:url';
import {google, PROJECT} from './runtime-config.mjs';

/** Never publish raw runtime messages: they may contain signed URLs or keys. */
export function courseErrorCategories(entry) {
  const text=JSON.stringify(entry.textPayload ?? entry.jsonPayload ?? '');
  const categories=[];
  for (const [pattern, category] of [
    [/memory limit|out of memory|OOM|SIGKILL/i,'memory_exhaustion'],
    [/timed out|timeout|ETIMEDOUT/i,'timeout'],
    [/LOCAL_TRANSCRIPTION|local-transcription-worker|Whisper/i,'local_transcription'],
    [/Cannot find module|Module not found|Could not resolve/i,'missing_dependency'],
    [/PERMISSION_DENIED|permission denied/i,'permission_denied'],
    [/lease|ownership|generation.*fenc/i,'lease_or_ownership'],
    [/413|payload too large/i,'upload_payload_limit'],
    [/ULTIMATE_SCENE_LICENSE|license.*required/i,'media_evidence_dependency'],
  ]) if(pattern.test(text)) categories.push(category);
  return categories.length ? categories : ['unclassified_runtime_error'];
}

export function auditCourseProduction(run=google) {
  const report={project:PROJECT,region:'us-central1',observedAt:new Date().toISOString(),failures:[]};
  try {
    const job=JSON.parse(run(['run','jobs','describe','elevate-course-builder','--project',PROJECT,'--region','us-central1','--format=json']));
    const task=job.spec?.template?.spec?.template?.spec;
    report.job={generation:job.metadata?.generation,serviceAccount:task?.serviceAccountName,
      image:task?.containers?.[0]?.image,resources:task?.containers?.[0]?.resources?.limits,
      timeoutSeconds:task?.timeoutSeconds};
  } catch(error) {report.failures.push({operation:'job_readback',code:error.code??'read_failed'});}
  try {
    const logs=JSON.parse(run(['logging','read','resource.type="cloud_run_job" AND resource.labels.job_name="elevate-course-builder" AND severity>=ERROR','--project',PROJECT,'--freshness=24h','--limit=50','--format=json']));
    report.runtimeErrors=logs.map(entry=>({timestamp:entry.timestamp,categories:courseErrorCategories(entry)}));
  } catch(error) {report.failures.push({operation:'worker_error_logs',code:error.code??'read_failed'});}
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(auditCourseProduction(),null,2));
