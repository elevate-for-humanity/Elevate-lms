/** Read hints only. Callers must supply an authenticated tree and retain path guards. */
export function rankSourcePaths(query, tree = []) {
  const cleaned = String(query).replace(/\b[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\b/gi, '')
    .replace(/\b[a-f0-9]{7,}\b/gi, '');
  const terms = [...new Set(cleaned.toLowerCase().match(/[a-z][a-z0-9]{1,}/g) ?? [])]
    .filter(term => (term.length >= 3 || term === 'ai') && !['the','and','for','job','build','repair','source','confirmed','first','preserve'].includes(term));
  const producers = /REPAIR_PRODUCER_UNCHANGED/.test(query) ? [
    'lib/ultimate-course-builder/core/production-handlers.ts',
    'lib/ultimate-course-builder/core/build-runner.ts',
    'lib/ultimate-course-builder/core/repair-router.ts',
  ] : [];
  return tree.filter(entry => entry.type === 'blob').map(({path}) => {
    const parts = path.toLowerCase().split(/[^a-z0-9]+/);
    const priority = producers.indexOf(path);
    return {path, score: priority < 0 ? terms.filter(term => parts.includes(term)).length : 100 - priority};
  }).filter(entry => entry.score > 0)
    .sort((a,b) => b.score-a.score || a.path.length-b.path.length || a.path.localeCompare(b.path))
    .slice(0,12).map(entry => entry.path);
}

/** Keep a bounded inventory independently of the rolling inference observations. */
export function rememberSourcePaths(previous = [], paths = []) {
  return [...new Set([...previous, ...paths].filter(path => typeof path === 'string' &&
    path.length <= 256 && /^(?:lib|apps|components|workers|tests|remotion-src)\/[a-zA-Z0-9_./-]+$/.test(path) &&
    !path.includes('..') && !path.includes('/.')))].slice(-64);
}

/** Expose a relevant middle section without exceeding the source read budget. */
export function focusedSourceExcerpt(content, task = '', limit = 16000) {
  if (content.length <= limit) return content;
  const symbols = [...new Set(String(task).match(/\b[A-Z][A-Z0-9_]{5,}\b/g) ?? [])];
  const stages = ['synchronization','natural_narration','lesson_film_render'].filter(stage => task.includes(stage));
  const anchor = [...symbols, ...stages].map(term => content.indexOf(term)).find(index => index >= 0);
  const marker = '\n…[source excerpt omitted]…\n';
  if (anchor === undefined || anchor < limit / 2 || anchor > content.length-limit/2)
    return content.slice(0, limit/2-marker.length) + marker + content.slice(-limit/2);
  const header = Math.min(512, Math.floor(limit/8)), tail = Math.floor(limit/8);
  const window = limit-header-tail-marker.length*2;
  const start = Math.max(header, anchor-512);
  return content.slice(0,header) + marker + content.slice(start,start+window) + marker + content.slice(-tail);
}
