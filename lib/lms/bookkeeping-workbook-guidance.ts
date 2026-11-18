/** Separate the existing authored example from its activity without rewriting amounts. */
export function bookkeepingWorkedExample(prompt: string) {
  const prefix = 'Apply this to a second fictional business: ';
  const taskStart = prompt.indexOf(
    ' Explain each source document, journal entry, ledger balance and statement effect.',
  );
  if (!prompt.startsWith(prefix) || taskStart < prefix.length) return null;
  return {
    example: prompt.slice(prefix.length, taskStart),
    activity: prompt.slice(taskStart).trim(),
  };
}
