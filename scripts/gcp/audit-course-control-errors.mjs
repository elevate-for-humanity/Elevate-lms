import { google, PROJECT } from './runtime-config.mjs';
const filter = 'resource.type="cloud_run_revision" AND resource.labels.service_name="elevate-admin" AND (jsonPayload.message:"Build could not be started on Google" OR jsonPayload.message:"Course Builder worker dispatch failed" OR textPayload:"Build could not be started on Google" OR textPayload:"Course Builder worker dispatch failed")';
try {
  const rows = JSON.parse(google(['logging','read',filter,'--project='+PROJECT,'--freshness=6h','--limit=20','--format=json']));
  const reasons = {};
  for (const row of rows) {
    let entry=row.jsonPayload;
    if(!entry&&row.textPayload){try{entry=JSON.parse(row.textPayload);}catch{entry={};}}
    const message=String(entry?.context?.error??entry?.error?.message??entry?.error?.error??'');
    const reason=/dispatch token is not configured|GITHUB_TOKEN is not configured/.test(message)?'worker_dispatch_token_missing':
      /dispatch refused: HTTP 401/.test(message)?'worker_dispatch_authentication_failed':
      /dispatch refused: HTTP 403/.test(message)?'worker_dispatch_forbidden':
      /dispatch refused: HTTP 404/.test(message)?'worker_dispatch_workflow_not_found':
      /duplicate|23505/.test(message)?'queue_conflict':
      /permission|42501/.test(message)?'queue_permission_failure':
      /fetch failed|timeout|timed out/i.test(message)?'worker_dispatch_network_failure':'unclassified_server_failure';
    reasons[reason]=(reasons[reason]??0)+1;
  }
  // No raw log rows, runtime credentials, identities or course content leave
  // this process. Only fixed diagnostic categories are printed.
  console.log(JSON.stringify({courseControlErrors:{count:rows.length,reasons}}));
} catch(error) {
  console.log(JSON.stringify({courseControlErrors:{unavailable:true,reason:error?.code??'read_failed'}}));
}
