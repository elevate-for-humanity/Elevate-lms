/**
 * Deterministic cleanup for provider JSON at the Course Factory boundary.
 *
 * This does not invent course content. It only removes transport artifacts and
 * repairs unambiguous punctuation defects that otherwise make a complete paid
 * generation unusable. Semantic completeness remains enforced by Zod.
 */
export function normalizeProviderJson(raw: string): string {
  let candidate = raw.replace(/^\uFEFF/, '').trim();
  if (!candidate) return candidate;

  candidate = extractBalancedObject(candidate);
  candidate = candidate.replace(/,\s*([}\]])/g, '$1');

  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      JSON.parse(candidate);
      return candidate;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const positionMatch = message.match(/position\s+(\d+)/i);
      if (!positionMatch) return candidate;

      const position = Number(positionMatch[1]);
      if (!Number.isInteger(position) || position < 0 || position > candidate.length) {
        return candidate;
      }

      if (/Expected ',' or '[}\]]' after (?:array element|property value)/i.test(message)) {
        candidate = `${candidate.slice(0, position)},${candidate.slice(position)}`;
        continue;
      }

      return candidate;
    }
  }

  return candidate;
}

function extractBalancedObject(value: string): string {
  const start = value.indexOf('{');
  if (start < 0) return value;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const character = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === '{' || character === '[') {
      depth += 1;
    } else if (character === '}' || character === ']') {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }

  return value.slice(start);
}
