// One durable repair turn must fit inside the 240s workflow HTTP request.
export const REPAIR_INFERENCE_TIMEOUT_MS = 210_000;

/** Keep the task and system rules intact; bound diagnostic observations using
 * the same conservative estimate as the owned provider. Partial source is
 * explicitly labelled so it cannot be mistaken for a complete file. */
export function budgetRepairMessages(messages, contextTokens = 8192, completionTokens = 2400) {
  const context = Math.max(2048, Number.isFinite(contextTokens) ? contextTokens : 8192);
  const promptLimit = (context - completionTokens - 512 - messages.length * 12) * 3;
  const system = messages[0];
  const input = JSON.parse(messages[1].content);
  const observations = input.observations ?? [];
  const selected = [];
  const render = () => JSON.stringify({ ...input, observations: selected });
  const fits = () => system.content.length + render().length <= promptLimit;
  if (!fits()) throw Error('PARIS_REPAIR_TASK_EXCEEDS_MODEL_CONTEXT');
  for (const observation of [...observations].reverse()) {
    selected.unshift(observation);
    if (fits()) continue;
    selected.shift();
    const suffix = '\n[Partial diagnostic excerpt; read the exact source before editing.]';
    let low = 0, high = observation.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      selected.unshift(observation.slice(0, middle) + suffix);
      const ok = fits();
      selected.shift();
      if (ok) low = middle; else high = middle - 1;
    }
    if (low > 0) selected.unshift(observation.slice(0, low) + suffix);
    break;
  }
  return [system, { ...messages[1], content: render() }];
}
