import {DISCOVERABLE_REPAIR_SOURCE, rankSourcePaths} from './paris-source-discovery.mjs';
const RECOVERABLE_DIRECTORY_SOURCE = /^(?:apps|lib|components|workers|remotion-src)\/[a-zA-Z0-9_./\[\]\(\)-]+$/;
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
export function recoverRepeatedInspection(history, action, observations = [], discoveredFiles = [], task = '') {
  if (!action || !['search','list','read','workflow_log'].includes(action.type) ||
      checkInspectionBudget(history, action).decision === 'inspect') return null;

  // Only use concrete files discovered by the authenticated branch inventory.
  // Never derive a path from a user goal, log contents or model guess.
  const candidates = [...discoveredFiles];
  for (const observation of [...observations].reverse()) {
    const line = String(observation);
    const search = line.match(/^SEARCH [^\n]*Candidate filenames from the task branch: (\[[^\n]*\])/);
    // A rejected read can append the authenticated directory inventory to its
    // feedback observation, separated by a literal "\\n" or a real newline.
    // Do not interpret a nested LIST within an unrelated log as tree evidence.
    const trustedListLine = line.startsWith('READ_REJECTED ')
      ? line.split(/\\n|\n/).find(part => part.startsWith('LIST ')) ?? ''
      : line;
    const listed = trustedListLine.match(/^LIST [^:]*: (\[[^\n]*\])/);
    try {
      if (search) candidates.push(...JSON.parse(search[1]));
      if (listed) candidates.push(...JSON.parse(listed[1])
        .filter(entry => entry?.type === 'file').map(entry => entry.path));
    } catch { /* Malformed observations cannot grant source authority. */ }
  }
  // When a diagnostic goal is known, never walk arbitrary unrelated files or
  // assertion suites simply because they were discovered earlier. Rank only
  // previously authenticated application filenames against the current defect;
  // zero relevant candidates means fail closed, not a fabricated repair.
  // Filter exhausted paths and duplicates before the ranker's 12-file cap.
  // Otherwise already-read paths can crowd out eligible authenticated files.
  const ranked = task ? rankSourcePaths(task, [...new Set(candidates)]
    .filter(path => typeof path === 'string' && !path.startsWith('tests/') &&
      !/(?:^|\/)(?:__tests__\/|[^/]+\.(?:test|spec)\.[a-z0-9]+$)/i.test(path) &&
      checkInspectionBudget(history, {type:'read',path}).decision === 'inspect')
    .map(path => ({type:'blob',path})), task) : candidates;
  for (const path of ranked) {
    if (typeof path !== 'string' || path.length > 256 ||
        !DISCOVERABLE_REPAIR_SOURCE.test(path) ||
        path.includes('..') || path.includes('/.')) continue;
    const candidate = {type:'read',path};
    if (checkInspectionBudget(history, candidate).decision === 'inspect') return candidate;
  }
  return null;
}


/**
 * On a truncated authenticated GitHub tree, a repeated source inspection may
 * exhaust every discovered file. Try one relevant parent directory from that
 * tree instead of repeating the same doomed planner action. The caller must
 * apply its existing directory authorization guard; this grants no authority.
 */
export function recoverRepeatedDirectoryInspection(history, action, tree = [], task = '', allowDirectory = /** @type {(path: string) => boolean} */ (() => false)) {
  if (!Array.isArray(tree) || !String(task).trim() ||
      !['redirect', 'stop'].includes(checkInspectionBudget(history, action).decision)) return null;

  // Authorization and the durable inspection budget must be checked BEFORE
  // ranking/capping. Otherwise 12 exhausted or rejected directories can hide
  // an unvisited, authenticated source directory behind the ranking cap.
  const eligibleDirectory = path => typeof path === 'string' && path.length <= 256 &&
    RECOVERABLE_DIRECTORY_SOURCE.test(path) &&
    !path.includes('..') && !path.includes('/.') && allowDirectory(path) &&
    checkInspectionBudget(history, {type: 'list', path}).decision === 'inspect';

  // Keep one best-ranked authenticated blob per parent. Many files from one
  // already-inspected directory must not crowd out other eligible parents.
  const blobsByParent = new Map();
  for (const entry of tree) {
    if (entry?.type !== 'blob' || typeof entry.path !== 'string' ||
        !(DISCOVERABLE_REPAIR_SOURCE.test(entry.path) ||
          (/[()[\]]/.test(entry.path) && RECOVERABLE_DIRECTORY_SOURCE.test(entry.path))) ||
        entry.path.includes('..') || entry.path.includes('/.')) continue;
    const parent = entry.path.slice(0, entry.path.lastIndexOf('/'));
    if (!eligibleDirectory(parent)) continue;
    if (!blobsByParent.has(parent)) blobsByParent.set(parent, []);
    blobsByParent.get(parent).push(entry);
  }
  const representativeBlobs = [...blobsByParent.values()].map(entries => {
    const best = rankSourcePaths(task, entries, task)[0];
    return best ? {type: 'blob', path: best} : null;
  }).filter(Boolean);
  const rankedPaths = rankSourcePaths(task, representativeBlobs, task);
  const parents = rankedPaths.map(path => path.slice(0, path.lastIndexOf('/')));

  const terms = new Set((String(task).toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? [])
    .filter(term => !['the', 'and', 'for', 'job', 'build', 'repair', 'source',
      'failed', 'error', 'unknown', 'failure', 'data'].includes(term)));
  const matchingTreeDirs = tree.filter(entry => entry?.type === 'tree' &&
    eligibleDirectory(entry.path)).map(entry => ({
      path: entry.path,
      score: entry.path.toLowerCase().split(/[^a-z0-9]+/).filter(part => terms.has(part)).length,
    })).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.path.length - b.path.length || a.path.localeCompare(b.path))
    .slice(0, 12).map(item => item.path);

  for (const path of [...new Set([...parents, ...matchingTreeDirs])].slice(0, 24)) {
    if (typeof path !== 'string' || path.length > 256 ||
        !RECOVERABLE_DIRECTORY_SOURCE.test(path) ||
        path.includes('..') || path.includes('/.') ||
        !allowDirectory(path)) continue;
    const proposed = {type: 'list', path};
    if (checkInspectionBudget(history, proposed).decision === 'inspect') return proposed;
  }
  return null;
}

// Preserve the existing external helper contract for a narrowly scoped
// repeated search; the generalized recovery is also used by the planner.
export function recoverRepeatedSearch(history, action, observations = []) {
  if (action?.type !== 'search') return null;
  return recoverRepeatedInspection(history, action, observations);
}
