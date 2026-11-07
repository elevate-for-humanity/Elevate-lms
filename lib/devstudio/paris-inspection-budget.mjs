/** Deterministic, durable limit on unproductive PARIS discovery loops.
 * This is only a planner budget guard; it grants no repository write authority.
 */
export function inspectActionKey(action) {
  if (!action || !['search','list','read','workflow_log'].includes(action.type)) return null;
  const target = action.type === 'search' ? action.query : action.type === 'workflow_log' ? String(action.runId)+':'+String(action.jobId) : action.path;
  return action.type + ':' + String(target ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function checkInspectionBudget(history, action) {
  const key = inspectActionKey(action);
  if (!key) return {decision:'not-inspection',key:null};
  const prior = history.filter(item => item === key).length;
  if (prior >= 2) return {decision:'stop',key};
  if (prior === 1) return {decision:'redirect',key};
  return {decision:'inspect',key};
}

/**
 * Deterministically recover from a repeated unsuccessful search using filenames
 * already returned by the trusted repository tree. Never guess a new file or
 * relax path authorization: the normal readFile guard still validates the path.
 */
export function recoverRepeatedInspection(history, action, observations = []) {
  if (!action || !['search','list','read','workflow_log'].includes(action.type) ||
      checkInspectionBudget(history, action).decision === 'inspect') return null;

  // Only use concrete files discovered by the authenticated branch inventory.
  // Never derive a path from a user goal, log contents or model guess.
  const candidates = [];
  for (const observation of [...observations].reverse()) {
    const line = String(observation);
    const search = line.match(/Candidate filenames from the task branch: (\\[[^\\n]*\\])/);
    const listed = line.match(/^LIST [^:]*: (\\[[^\\n]*\\])/);
    try {
      if (search) candidates.push(...JSON.parse(search[1]));
      if (listed) candidates.push(...JSON.parse(listed[1])
        .filter(entry => entry?.type === 'file').map(entry => entry.path));
    } catch { /* Malformed observations cannot grant source authority. */ }
  }
  for (const path of candidates) {
    if (typeof path !== 'string' || path.length > 256 ||
        !/^(?:lib|apps|components|workers|tests|remotion-src)\\/[a-zA-Z0-9_./-]+$/.test(path) ||
        path.includes('..') || path.includes('/.')) continue;
    const candidate = {type:'read',path};
    if (checkInspectionBudget(history, candidate).decision === 'inspect') return candidate;
  }
  return null;
}

// Preserve the existing external helper contract for a narrowly scoped
// repeated search; the generalized recovery is also used by the planner.
export function recoverRepeatedSearch(history, action, observations = []) {
  if (action?.type !== 'search') return null;
  return recoverRepeatedInspection(history, action, observations);
}
