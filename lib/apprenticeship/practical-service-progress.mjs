/** A display label's capitalization does not define a different observed service. */
export function practicalServiceKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function practicalServiceProgress(requirements, progressRows) {
  const recorded = new Map();
  for (const row of progressRows ?? []) {
    const serviceName = practicalServiceKey(row.service_name);
    recorded.set(serviceName, (recorded.get(serviceName) ?? 0) + Math.max(0, Number(row.recorded_count ?? 0)));
  }
  const items = (requirements ?? []).map(requirement => {
    const requiredCount = Math.max(1, Number(requirement.required_count ?? 1));
    const recordedCount = Math.max(0, recorded.get(practicalServiceKey(requirement.service_name)) ?? 0);
    return {...requirement, requiredCount, recordedCount, complete: recordedCount >= requiredCount};
  });
  const completionItems = items.filter(item => item.counts_for_completion !== false);
  const requiredCount = completionItems.reduce((sum,item)=>sum+item.requiredCount,0);
  const recordedCount = completionItems.reduce((sum,item)=>sum+Math.min(item.recordedCount,item.requiredCount),0);
  return {
    items,
    requiredCount,
    recordedCount,
    percent: requiredCount ? Math.min(100,Math.round(recordedCount/requiredCount*100)) : 100,
    complete: completionItems.every(item=>item.complete),
  };
}
