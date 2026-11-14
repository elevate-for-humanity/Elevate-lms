export function describeWorkerError(error, seen = new Set()) {
 if(typeof error==='string' && error.trim()) return error;
 if(error && typeof error==='object') {
  if(seen.has(error)) return 'CIRCULAR_WORKER_ERROR';
  seen.add(error);
  const fields=[];
  for(const key of ['message','code','details','hint','status','statusCode','statusText']) {
   try { const v=error[key]; if((typeof v==='string'&&v.trim())||typeof v==='number') fields.push(key==='message'?String(v):key+'='+String(v)); } catch { /* Keep inspecting other fields when provider getters throw. */ }
  }
  for (const key of ['cause','originalError']) {
   try { if(error[key]) fields.push(key+'='+describeWorkerError(error[key],seen)); } catch { /* Keep inspecting other fields when provider getters throw. */ }
  }
  if(fields.length) return fields.join(':');
  try { const json=JSON.stringify(error); if(json&&json!=='{}') return json; } catch { /* Keep inspecting other fields when provider getters throw. */ }
 }
 return 'UNKNOWN_WORKER_ERROR:'+String(error);
}

/** Missing deterministic cache objects can surface through the Storage SDK as
 * a nested HTTP 400. Do not confuse those misses with auth or service errors. */
export function optionalStorageCacheMiss(error) {
 if(!error)return false;
 const status=Number(error.statusCode??error.status??error.originalError?.status);
 const detail=describeWorkerError(error);
 if(/unauthori[sz]ed|forbidden|permission|jwt|signature|service unavailable|timeout/i.test(detail))return false;
 return status===400||status===404||/not found|does not exist|no such object/i.test(detail);
}
