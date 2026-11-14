/** Each Next app has its own build ID prefix; provenance must agree on the commit. */
export function productionBuildParity(results) {
  if (results.length !== 3 || new Set(results.map(row => row.name)).size !== 3)
    return { ok: false, message: 'All three production services must report their build identity.' };
  for (const row of results) {
    if (!/^[a-f0-9]{40}$/i.test(row.commitSha || ''))
      return { ok: false, message: `${row.name} did not report a valid commit SHA.` };
    const allowedIds = new Set([`elevate-${row.commitSha}`, `${row.name}-${row.commitSha}`, row.commitSha.slice(0, 7)]);
    if (!allowedIds.has(row.buildId))
      return { ok: false, message: `${row.name} build ID does not attest to its reported commit.` };
  }
  const commits = new Set(results.map(row => row.commitSha));
  if (commits.size !== 1)
    return { ok: false, message: `Production services are deployed from ${commits.size} different commits: ${[...commits].join(', ')}` };
  return { ok: true, message: `All three production services attest to commit ${results[0].commitSha}.` };
}
