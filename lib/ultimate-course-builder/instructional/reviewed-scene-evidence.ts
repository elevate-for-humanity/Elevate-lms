/** Task-compatible visual matching. Descriptions may be paraphrased or reordered;
 * filler words are not evidence. This is deterministic matching over supplied
 * observations, not a claim to infer unseen actions from a filename or title. */
const FILLER = new Set((
  'a an and are as at be by for from how in into is it of on or the to using with ' +
  'your their his her its this that show showing relevant non looping instructional ' +
  'visual visuals scene footage video clip lesson course stock template overview ' +
  'context contextual example closeup visible clearly'
).split(' '));

// Deliberately narrow equivalents; distinct actions (washing/disinfecting,
// recovery/evacuation, connecting/disconnecting) must remain distinct.
const EQUIVALENTS: Record<string, string> = {};
for (const group of [
  ['shampoo', 'shampooing', 'shampooed'],
  ['massage', 'massaging', 'massaged'],
  ['consult', 'consultation', 'consulting', 'conversation', 'talking', 'discussing'],
  ['organize', 'organizing', 'organisation', 'organization', 'arranging', 'arrangement'],
  ['prepare', 'preparing', 'preparation'],
  ['inspect', 'inspecting', 'inspection'],
  ['measure', 'measuring', 'measurement'],
  ['test', 'testing', 'tested'],
  ['clean', 'cleaning', 'cleaned'],
  ['disinfect', 'disinfecting', 'disinfection'],
  ['sanitize', 'sanitizing', 'sanitation'],
  ['sterilize', 'sterilizing', 'sterilization'],
  ['calibrate', 'calibrating', 'calibration'],
  ['recover', 'recovering', 'recovery'],
  ['evacuate', 'evacuating', 'evacuation'],
  ['approve', 'approval', 'approved', 'approving'],
  ['verify', 'verification', 'verified', 'verifying'],
  ['supervise', 'supervision', 'supervisor', 'supervising'],
  ['cut', 'cutting', 'trimming', 'trim'],
  ['shave', 'shaving', 'shaved'],
  ['color', 'colour', 'coloring', 'colouring'],
  ['bleach', 'bleaching'],
  ['connect', 'connecting', 'connected'],
  ['disconnect', 'disconnecting', 'disconnected'],
  ['install', 'installing', 'installation'],
  ['remove', 'removing', 'removal'],
  ['repair', 'repairing', 'repaired'],
  ['start', 'starting', 'started'],
  ['stop', 'stopping', 'stopped'],
  ['increase', 'increasing', 'increased'],
  ['decrease', 'decreasing', 'decreased'],
  ['client', 'customer'],
  ['basin', 'sink'],
  ['scissor', 'shear'],
]) for (const word of group) EQUIVALENTS[word] = group[0];

const TASKS = new Set(Object.values(EQUIVALENTS).filter(
  (word) => !['client', 'basin', 'scissor'].includes(word),
));
const QUALIFIERS = new Set([
  'high', 'low', 'hot', 'cold', 'ac', 'dc', 'inlet', 'outlet', 'suction', 'discharge',
  'open', 'closed', 'energized', 'deenergized', 'correct', 'incorrect',
]);
const OPPOSITES = [
  ['high', 'low'], ['hot', 'cold'], ['ac', 'dc'], ['inlet', 'outlet'],
  ['suction', 'discharge'], ['open', 'closed'], ['energized', 'deenergized'],
  ['correct', 'incorrect'], ['connect', 'disconnect'], ['start', 'stop'],
  ['increase', 'decrease'],
];

function taskText(value: string): string {
  return value.toLowerCase().replace(/[’']/g, '')
    .replace(/\bnon[- ]looping\b/g, ' ')
    .replace(/\bduring\s+(?:why\s+it\s+matters|introduction|overview|recap|summary|knowledge\s+check)[.!?]*\s*$/g, ' ')
    .replace(/\b(?:wash(?:ing|ed)?)(?:\s+(?:the|a|clients?))*\s+hair\b/g, 'shampoo hair')
    .replace(/\bclose[- ]up\b/g, 'closeup');
}

function taskTerms(value: string): string[] {
  return [...new Set((taskText(value).match(/[a-z0-9]+/g) ?? []).flatMap((word) => {
    if (FILLER.has(word) || (word.length < 2 && !/^\d+$/.test(word))) return [];
    const singular = word.length > 3 && word.endsWith('s') && !word.endsWith('ss')
      ? word.slice(0, -1) : word;
    return [EQUIVALENTS[word] ?? EQUIVALENTS[singular] ?? singular];
  }))];
}

/** No sentence-equality requirement. Preserve requested actions and technical
 * qualifiers; require substantive subject overlap as well as task overlap. */
export function compatibleVisualTask(requirement: string, action: string) {
  const requiredText = taskText(requirement);
  const availableText = taskText(action);
  // Unstructured negation/order cannot safely establish positive action coverage.
  const qualified = /\b(no|not|never|without|avoid|dont|doesnt|cannot|before|after)\b|\bnon[- ]|step[- ]by[- ]step/;
  if (qualified.test(requiredText) || qualified.test(availableText)) return null;
  const required = taskTerms(requirement);
  const available = new Set(taskTerms(action));
  if (!required.length || !available.size) return null;
  const matchedTerms = required.filter((word) => available.has(word));
  const requiredTasks = required.filter((word) => TASKS.has(word));
  const subjects = required.filter((word) => !TASKS.has(word) && !QUALIFIERS.has(word));
  if (requiredTasks.some((word) => !available.has(word))) return null;
  if (required.some((word) => (QUALIFIERS.has(word) || /^\d+$/.test(word)) && !available.has(word))) return null;
  if (OPPOSITES.some(([left, right]) =>
    (required.includes(left) && !required.includes(right) && available.has(right)) ||
    (required.includes(right) && !required.includes(left) && available.has(left)))) return null;
  if (subjects.length && !subjects.some((word) => available.has(word))) return null;
  const requirementCoverage = matchedTerms.length / required.length;
  if (matchedTerms.length < Math.min(2, required.length) || requirementCoverage < 0.6) return null;
  return { matchMethod: 'task-compatible' as const, matchedTerms, requirementCoverage };
}

/** Persisted frame observations establish contextual coverage, not a complete procedure. */
export function reviewedSceneEvidence(scene: any, asset: any) {
  const observation = asset.visual_observation;
  if (!observation || observation.method !== 'sampled-frame-inspection') return null;
  if (!/^[a-f0-9]{64}$/i.test(String(asset.content_sha256 ?? ''))) return null;
  if (observation.contentSha256 !== asset.content_sha256) return null;
  if (!Number.isFinite(Date.parse(String(observation.reviewedAt ?? '')))) return null;
  const fractions = observation.sampleFractions;
  if (!Array.isArray(fractions) || !fractions.length ||
      fractions.some((fraction: unknown) => typeof fraction !== 'number' ||
        !Number.isFinite(fraction) || fraction < 0 || fraction > 1)) return null;
  if ([scene.sceneType, scene.scene_type, scene.stage, scene.title].some(
    (value) => String(value ?? '').trim().toLowerCase() === 'demonstration',
  )) return null;
  const requirement = String(scene.visualRequirement ?? '');
  const actions: string[] = Array.isArray(observation.visibleActions)
    ? observation.visibleActions.filter((value: unknown): value is string =>
        typeof value === 'string' && Boolean(value.trim())) : [];
  const matches = actions.flatMap((action) => {
    const evidence = compatibleVisualTask(requirement, action);
    return evidence ? [{ action, ...evidence }] : [];
  });
  if (!matches.length) return null;
  return {
    contentSha256: asset.content_sha256,
    method: observation.method,
    reviewedAt: observation.reviewedAt,
    sampleFractions: [...fractions],
    matchedActions: matches.map((match) => match.action),
    matchMethod: 'task-compatible' as const,
    matchedTerms: [...new Set(matches.flatMap((match) => match.matchedTerms))],
    requirementCoverage: Math.max(...matches.map((match) => match.requirementCoverage)),
    scope: String(observation.scope ?? 'Visible actions at sampled times only.'),
  };
}
