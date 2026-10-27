// Preserve errors thrown by other realms, providers, and non-enumerable Error fields.
export function describeWorkerError(error, seen = new Set()) {
 if (typeof error === 'string' && error.trim()) return error;
 if (error && typeof error === 'object') {
  if (seen.has(error)) return 'CIRCULAR_WORKER_ERROR';
  seen.add(error);
  const fields = ['name','code','message','details','hint','status'].map(key => {
   try { const value=error[key]; return typeof value==='string' || typeof value==='number' ? key+'='+String(value) : ''; }
   catch { return ''; }
  }).filter(Boolean);
  try { if(error.cause) fields.push('cause='+describeWorkerError(error.cause,seen)); } catch {}
  if(fields.length) return fields.join(':');
  try { const json=JSON.stringify(error); if(json && json!=='{}') return json; } catch {}
 }
 return 'UNKNOWN_WORKER_ERROR:'+String(error);
}
