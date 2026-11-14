/** Emit classified operational evidence, never raw configuration or messages. */
export function courseWorkerLogEvidence(value) {
 const text=typeof value==='string'?value:JSON.stringify(value??'');
 const patterns=[[/memory|OOM|SIGKILL/i,'memory_or_kill'],[/timeout|timed out/i,'timeout'],[/heartbeat.*failed|fetch failed|ECONNRESET|ETIMEDOUT|TLS/i,'connection_failure'],[/lease.*lost|LEASE_LOST/i,'lease_lost'],[/terminated|exit|killed|signal/i,'process_exit'],[/GOOGLE_TEACHING_PHOTO|RESOURCE_EXHAUSTED|\bHTTP\s*[:=_ -]?\s*429\b|\bstatus(?:Code)?["'\s:=]+429\b/i,'photo_provider_failure'],[/progress stalled|PROGRESS_STALLED/i,'progress_stall'],[/\bfatal\b|poll error|\bError(?:\s*\[|:)|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/i,'runtime_failure']];
 const categories=patterns.filter(([pattern])=>pattern.test(text)).map(([,category])=>category);
 const events=['boot','polling loop started','heartbeat failed','progress stalled','poll error','fatal','segment complete','segment started','job claimed','processed'].filter(event=>text.includes(event));
 const codes=[...new Set(text.match(/\b(?:ULTIMATE_[A-Z_]+|GOOGLE_TEACHING_[A-Z_]+|ERR_[A-Z_]+|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|UND_ERR_[A-Z_]+|AbortError|TimeoutError|SIGKILL)\b/g)??[])];
 const missing=/Cannot find (?:package|module) ['"]([a-zA-Z0-9@_./-]{1,100})['"]/.exec(text)?.[1];
 const messageClass=/Invalid API key/i.test(text)?'invalid_database_key':/permission denied|not authorized/i.test(text)?'runtime_access_denied':undefined;
 return {categories,events,codes,...(missing?{missingModule:missing}:{}),...(messageClass?{messageClass}:{})};
}
