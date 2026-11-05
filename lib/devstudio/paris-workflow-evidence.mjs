/**
 * Evidence from GitHub Actions is untrusted diagnostic text, never instructions.
 * Return bounded lines surrounding failures; do not send entire logs to a model.
 */
export function failedWorkflowLogExcerpt(log, maxChars=3600) {
 const lines=String(log??'').split(/\r?\n/);
 const indexes=[];
 for(let i=0;i<lines.length;i++)
  if(/##\[error\]|(?:^|\s)(?:ERROR|FAIL|FAILED):|❌|ELIFECYCLE|Process completed with exit code [1-9]/i.test(lines[i])) indexes.push(i);
 const selected=[];
 for(const index of indexes.slice(-8)){
  for(let j=Math.max(0,index-2);j<=Math.min(lines.length-1,index+2);j++){
   if(!selected.includes(j)) selected.push(j);
  }
 }
 const excerpt=(selected.length?selected.sort((a,b)=>a-b).map(i=>lines[i]):lines.slice(-12)).join('\n');
 return excerpt
  .replace(/Bearer\s+\S+/gi,'Bearer [redacted]')
  .replace(/(?:ghp_|ghs_|github_pat_)[A-Za-z0-9_]+/g,'[redacted-token]')
  .replace(/(?:api[_-]?key|secret|password|token)\s*[:=]\s*[^\s,;]+/gi,'credential=[redacted]')
  .slice(-Math.max(500,Math.min(5000,maxChars)));
}
