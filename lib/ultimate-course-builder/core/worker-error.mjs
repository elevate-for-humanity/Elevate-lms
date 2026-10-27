export function describeWorkerError(error, seen = new Set()) {
 if(typeof error==='string' && error.trim()) return error;
 if(error && typeof error==='object') {
  if(seen.has(error)) return 'CIRCULAR_WORKER_ERROR';
  seen.add(error);
  const fields=[];
  for(const key of ['message','code','details','hint','status']) {
   try { const v=error[key]; if((typeof v==='string'&&v.trim())||typeof v==='number') fields.push(key==='message'?String(v):key+'='+String(v)); } catch { /* Keep inspecting other fields when provider getters throw. */ }
  }
  try { if(error.cause) fields.push('cause='+describeWorkerError(error.cause,seen)); } catch { /* Keep inspecting other fields when provider getters throw. */ }
  if(fields.length) return fields.join(':');
  try { const json=JSON.stringify(error); if(json&&json!=='{}') return json; } catch { /* Keep inspecting other fields when provider getters throw. */ }
 }
 return 'UNKNOWN_WORKER_ERROR:'+String(error);
}
