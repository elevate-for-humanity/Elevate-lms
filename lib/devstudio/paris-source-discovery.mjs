/** Read hints only. Callers must supply an authenticated tree and retain path guards. */
export const DISCOVERABLE_REPAIR_SOURCE = /^(?:(?:lib|apps|components|workers|tests|remotion-src)\/[a-zA-Z0-9_./-]+|scripts\/gcp\/[a-zA-Z0-9_.-]+\.(?:mjs|py)|\.github\/workflows\/[a-zA-Z0-9_.-]+\.ya?ml)$/;
const binaryFixture = /\.(?:png|jpe?g|webp|gif|ico|mp[34]|pdf|zip|woff2?|ttf)$/i;
function discoveryTerms(value) {
  const cleaned = String(value).replace(/\b[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\b/gi, '')
    .replace(/\b[a-f0-9]{7,}\b/gi, '');
  return [...new Set(cleaned.toLowerCase().match(/[a-z][a-z0-9]{1,}/g) ?? [])]
    .filter(term => (term.length >= 3 || term === 'ai') &&
      !['the','and','for','job','build','repair','source','confirmed','first','preserve',
        'not','failed','error','unknown','failure','data','message','severity','step'].includes(term));
}
export function rankSourcePaths(query, tree = [], task = '') {
  const terms = discoveryTerms(query), context = discoveryTerms(task);
  const evidence = String(query) + ' ' + String(task);
  const exact = new Set(evidence.match(/(?:(?:lib|apps|components|workers|tests|remotion-src)\/[A-Za-z0-9_./-]+|scripts\/gcp\/[A-Za-z0-9_.-]+\.(?:mjs|py)|\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml)/g) ?? []);
  const producers = /REPAIR_PRODUCER_UNCHANGED/.test(evidence) ? [
    'lib/ultimate-course-builder/core/production-handlers.ts',
    'lib/ultimate-course-builder/core/build-runner.ts',
    'lib/ultimate-course-builder/core/repair-router.ts',
  ] : [];
  return tree.filter(entry => entry.type === 'blob' && !binaryFixture.test(entry.path)).map(({path}) => {
    const parts = path.toLowerCase().split(/[^a-z0-9]+/);
    const priority = producers.indexOf(path);
    // The current diagnostic query must outweigh generic goal words such as
    // lesson, quality and tests. Exact paths remain hints from this tree only.
    const sourceScore=terms.filter(term => parts.includes(term)).length * 4 +
      context.filter(term => parts.includes(term)).length / 4;
    // Application producer code beats generic legacy tests unless a specific
    // test was named by trusted diagnostic evidence.
    const score = exact.has(path) ? 200 : priority >= 0 ? 100-priority :
      sourceScore - (path.startsWith('tests/') ? 6 : 0);
    return {path,score};
  }).filter(entry => entry.score > 0)
    .sort((a,b) => b.score-a.score || a.path.length-b.path.length || a.path.localeCompare(b.path))
    .slice(0,12).map(entry => entry.path);
}

/** Keep a bounded inventory independently of the rolling inference observations. */
export function rememberSourcePaths(previous = [], paths = []) {
  return [...new Set([...paths, ...previous].filter(path => typeof path === 'string' &&
    path.length <= 256 && DISCOVERABLE_REPAIR_SOURCE.test(path) &&
    !path.includes('..') && !path.includes('/.') && !binaryFixture.test(path)))].slice(0,64);
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
