/**
 * Durable, bounded source excerpts for PARIS planner continuations.
 * Only the authenticated GitHub readFile() success path may create entries.
 * General diagnostic observations roll over after eight turns; exact source
 * evidence must not disappear with unrelated workflow/search diagnostics.
 */
const MAX_FILES = 2;
const MAX_EXCERPT_CHARS = 2400;

export function rememberVerifiedRepairSource(previous = [], {path, sha, excerpt}) {
  if (typeof path !== 'string' || !path || !/^[a-f0-9]{40}$/.test(String(sha)) ||
      typeof excerpt !== 'string' || !excerpt)
    throw Error('PARIS_VERIFIED_SOURCE_EVIDENCE_INVALID');
  const valid = Array.isArray(previous) ? previous.filter(entry =>
    entry && typeof entry.path === 'string' && entry.path !== path &&
    /^[a-f0-9]{40}$/.test(String(entry.sha)) && typeof entry.excerpt === 'string') : [];
  return [...valid, {path, sha, excerpt: excerpt.slice(0, MAX_EXCERPT_CHARS)}].slice(-MAX_FILES);
}

export function discardChangedRepairSource(previous = [], path) {
  return (Array.isArray(previous) ? previous : []).filter(entry => entry?.path !== path);
}

/** Source evidence stays most recent for context-budget trimming. */
export function repairPlannerObservations(observations = [], verifiedSources = []) {
  const recent = Array.isArray(observations) ? observations.slice(-6) : [];
  const sources = (Array.isArray(verifiedSources) ? verifiedSources : []).filter(entry =>
    entry && typeof entry.path === 'string' &&
    /^[a-f0-9]{40}$/.test(String(entry.sha)) && typeof entry.excerpt === 'string')
    .slice(-MAX_FILES).map(entry =>
      'VERIFIED_SOURCE ' + entry.path + ' (blob ' + entry.sha + '), truncated excerpt; read exact file again if more context is required:\n' +
      entry.excerpt.slice(0, MAX_EXCERPT_CHARS));
  return [...recent, ...sources];
}
