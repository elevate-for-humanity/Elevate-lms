import {pathToFileURL} from 'node:url';
import {google,PROJECT} from './runtime-config.mjs';

// Report only known provider failures and request metadata, never prompts,
// generated content, credentials, arbitrary error messages or stack traces.
export function summarizeParisLogs(entries) {
 return entries.map(entry=>{
  let payload=entry.jsonPayload;
  if(!payload)try{payload=JSON.parse(entry.textPayload||'');}catch{}
  const error=payload?.error?.message;
  const known=typeof error==='string'&&(/^(?:Elevate LLM worker streaming request failed: HTTP \d{3}|Elevate LLM worker did not return an event stream|Elevate LLM stream event exceeds the size limit|Elevate LLM worker reported a stream error|Elevate LLM stream ended before completion|Elevate LLM worker returned no text content|Elevate LLM prompt is too large for the configured \d+-token context window|ELEVATE_GOOGLE_MODEL_IDENTITY_UNAVAILABLE|fetch failed|The operation was aborted due to timeout)$/.test(error));
  return {
   timestamp:entry.timestamp,
   service:entry.resource?.labels?.service_name,
   revision:entry.resource?.labels?.revision_name,
   ...(payload?.message==='[devstudio/chat] owned stream failed'?{failure:known?error:'unclassified_provider_failure'}:{}),
   ...(Number.isInteger(entry.httpRequest?.status)?{httpStatus:entry.httpRequest.status}:{}),
   ...(/^\d+(?:\.\d+)?s$/.test(entry.httpRequest?.latency||'')?{latency:entry.httpRequest.latency}:{}),
  };
 });
}

export function diagnoseParisRuntime({run=google}={}) {
 const filter='resource.type="cloud_run_revision" AND ((resource.labels.service_name="elevate-admin-migration" AND jsonPayload.message="[devstudio/chat] owned stream failed") OR (resource.labels.service_name="elevate-owned-cpu-llm" AND httpRequest.requestMethod="POST"))';
 const entries=JSON.parse(run(['logging','read',filter,'--project',PROJECT,'--freshness=4h','--limit=50','--format=json']));
 if(!Array.isArray(entries))throw Error('PARIS_DIAGNOSTIC_INVALID_RESPONSE');
 return {readOnly:true,configurationChanged:false,permissionsChanged:false,events:summarizeParisLogs(entries)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
 try{console.log(JSON.stringify(diagnoseParisRuntime(),null,2));}
 catch(error){console.error(JSON.stringify({error:error.code||'PARIS_DIAGNOSTIC_FAILED'}));process.exitCode=1;}
}
