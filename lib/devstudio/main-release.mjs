export async function publishTaskToMain({baseSha,branchSha,githubJson}) {
  if(!/^[a-f0-9]{40}$/.test(baseSha||'')||!/^[a-f0-9]{40}$/.test(branchSha||'')||baseSha===branchSha)
    throw Error('Distinct verified task and base commits are required');
  const latest=await githubJson('/git/ref/heads/main');
  if(latest?.object?.sha!==baseSha) throw Error('Main changed during this task; changes are retained on the task branch for reconciliation');
  // A concurrent main update is rejected by GitHub's non-force fast-forward check.
  // Never reset main, bypass branch rules, or overwrite another release.
  const published=await githubJson('/git/refs/heads/main',{method:'PATCH',body:JSON.stringify({sha:branchSha,force:false})});
  if(published?.object?.sha!==branchSha) throw Error('Main publication was not confirmed');
  return {branch:'main',sha:branchSha,status:'pending-validation',verifiedLive:false};
}
