/**
 * Pure parser for literal Supabase mutation object keys. The auditor compares
 * only the outer payload columns with PostgREST schema. Conditional spreads
 * may contain nested JSON properties and must be skipped as balanced values,
 * not scanned as standalone database columns.
 */

function skipQuoted(source: string, index: number): number {
  const quote = source[index];
  index += 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index + 1;
    index += 1;
  }
  return index;
}

/**
 * Advance past one object-property value. The previous scanner resumed token
 * parsing immediately after the property colon, so ternaries such as
 * `error instanceof Error ? error.message : String(error)` were misread as a
 * property named `message`. The same bug produced impossible column names such
 * as `null`, `false`, and `now`.
 */
function skipPropertyValue(source: string, index: number): number {
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;

  while (index < source.length) {
    const ch = source[index];
    if (ch === '"' || ch === "'" || ch === '`') {
      index = skipQuoted(source, index);
      continue;
    }
    if (ch === '/' && source[index + 1] === '/') {
      const end = source.indexOf('\n', index + 2);
      index = end < 0 ? source.length : end + 1;
      continue;
    }
    if (ch === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);
      index = end < 0 ? source.length : end + 2;
      continue;
    }

    if (ch === '{') braces += 1;
    else if (ch === '}') {
      if (braces === 0 && brackets === 0 && parentheses === 0) return index;
      braces -= 1;
    } else if (ch === '[') brackets += 1;
    else if (ch === ']') brackets -= 1;
    else if (ch === '(') parentheses += 1;
    else if (ch === ')') parentheses -= 1;
    else if (ch === ',' && braces === 0 && brackets === 0 && parentheses === 0) {
      return index + 1;
    }
    index += 1;
  }
  return index;
}
export function topLevelObjectKeys(source: string, openBrace: number): string[] {
  const keys: string[] = [];
  let depth = 0;
  let i = openBrace;

  while (i < source.length) {
    const ch = source[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipQuoted(source, i);
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      i = source.indexOf('\n', i + 2);
      if (i < 0) break;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end < 0 ? source.length : end + 2;
      continue;
    }
    if (ch === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) break;
      i += 1;
      continue;
    }

    if (depth === 1) {
      if (/\s|,/.test(ch)) {
        i += 1;
        continue;
      }
      if (source.startsWith('...', i)) {
        i = skipPropertyValue(source, i + 3);
        continue;
      }

      let key = '';
      if (/[A-Za-z_$]/.test(ch)) {
        const start = i;
        i += 1;
        while (i < source.length && /[A-Za-z0-9_$]/.test(source[i])) i += 1;
        key = source.slice(start, i);
      } else if (ch === '"' || ch === "'") {
        const start = i + 1;
        const end = skipQuoted(source, i) - 1;
        key = source.slice(start, end);
        i = end + 1;
      } else {
        i += 1;
        continue;
      }

      while (i < source.length && /\s/.test(source[i])) i += 1;
      if (source[i] === ':') {
        keys.push(key.toLowerCase());
        i = skipPropertyValue(source, i + 1);
        continue;
      }
      // Shorthand object properties are valid but cannot be distinguished
      // reliably from method syntax here, so skip them rather than false-fail.
      continue;
    }
    i += 1;
  }
  return [...new Set(keys)];
}

