/** Deterministic, durable limit on unproductive PARIS discovery loops.
 * This is only a planner budget guard; it grants no repository write authority.
 */
export function inspectActionKey(action) {
  if (!action || !['search','list','read'].includes(action.type)) return null;
  const target = action.type === 'search' ? action.query : action.path;
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
