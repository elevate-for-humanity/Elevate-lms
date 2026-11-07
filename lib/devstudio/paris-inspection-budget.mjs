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
export function recoverRepeatedSearch(history, action, observations = []) {
  if (action?.type !== 'search' || checkInspectionBudget(history, action).decision !== 'redirect') return null;
  for (const observation of [...observations].reverse()) {
    const match = String(observation).match(/Candidate filenames from the task branch: (\[[^\n]*\])/);
    if (!match) continue;
    let paths;
    try { paths = JSON.parse(match[1]); } catch { continue; }
    if (!Array.isArray(paths)) continue;
    for (const path of paths) {
      if (typeof path !== 'string' || !/^(?:lib|apps|components|workers|tests|remotion-src)\/[a-zA-Z0-9_./-]+$/.test(path) ||
          path.includes('..') || path.includes('/.')) continue;
      const candidate = {type:'read',path};
      if (checkInspectionBudget(history, candidate).decision === 'inspect') return candidate;
    }
  }
  return null;
}
