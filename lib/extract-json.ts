/**
 * lib/extract-json.ts
 *
 * Robust JSON extraction from AI model output.
 *
 * LLMs frequently wrap JSON in markdown fences, prose preambles, and trailing
 * commentary even when explicitly told not to. Regex stripping is fragile.
 * This uses bracket-matching to find the outermost JSON structure, making it
 * immune to whatever decoration the model adds around the payload.
 */

/**
 * Extract and parse the first complete JSON object or array from a string.
 * Works on raw LLM output — handles markdown fences, prose, trailing text.
 *
 * @throws if no valid JSON structure is found
 */
export function extractJSON<T = unknown>(text: string): T {
  const objStart = text.indexOf('{');
  const arrStart = text.indexOf('[');

  let jsonStart: number;
  if (objStart === -1 && arrStart === -1) throw new Error('No JSON structure found in response');
  else if (objStart === -1) jsonStart = arrStart;
  else if (arrStart === -1) jsonStart = objStart;
  else jsonStart = Math.min(objStart, arrStart);

  const openChar = text[jsonStart];
  const closeChar = openChar === '{' ? '}' : ']';

  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (let i = jsonStart; i < text.length; i++) {
    const ch = text[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }

    if (!inString) {
      if (ch === '{' || ch === '[') stack.push(ch);
      else if (ch === '}' || ch === ']') {
        stack.pop();
        if (stack.length === 0) {
          return JSON.parse(text.slice(jsonStart, i + 1)) as T;
        }
      }
    }
  }

  throw new Error('Incomplete JSON structure in response');
}
