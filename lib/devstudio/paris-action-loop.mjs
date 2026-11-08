/**
 * Execution-specific guidance derived from persisted, authenticated source
 * inspection history. This is an action-selection preference, not repository
 * permission. The source read, hash-checked GitHub write, and protected CI
 * remain separately enforced by the engineering controller.
 */
export function nextRepairActionConstraint(history = [], writes = 0) {
  // Repeated reads of the same file do not count as independent source evidence.\n  const readCount = new Set(history.filter(key => typeof key === 'string' && key.startsWith('read:'))).size;
  if (writes > 0)
    return 'A source write was committed. Read back its exact changed code if needed, create a new independent regression test, and complete only with verified commit evidence.';
  if (readCount >= 2)
    return 'You have already read source files. Now propose a narrow exact replace using source text already inspected, or read only one missing specifically relevant file. Do not revisit a broad search/list or unrelated tests. If no justified patch exists, complete with the limitation; never invent a fix.';
  if (readCount === 1)
    return 'You have a verified source read. If it proves the defect, your NEXT JSON action should be replace (with exact old/replacement text) or create (a new implementation), not another broad search. If essential evidence is missing, read one exact relevant path.';
  return 'Discover the most relevant application source file (not a generic test), then read it. Replace only after verifying the actual source content.';
}

/** Readback proves a GitHub write actually returned the committed bytes. */
export function assertCommittedWriteReadback({expectedContent,observedContent,commitSha,branchSha,expectedBlobSha,observedBlobSha}) {
  if(!/^[a-f0-9]{40}$/.test(String(commitSha??'')) ||
     branchSha !== commitSha ||
     !/^[a-f0-9]{40}$/.test(String(expectedBlobSha??'')) ||
     observedBlobSha !== expectedBlobSha ||
     observedContent !== expectedContent)
    throw Error('PARIS_SOURCE_WRITE_READBACK_MISMATCH');
  return {commitSha,contentSha:observedBlobSha,verified:true};
}
