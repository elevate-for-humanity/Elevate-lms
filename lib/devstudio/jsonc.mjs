/** Parse JSONC without treating comment markers or commas inside strings as syntax. */
export function parseJsonc(input) {
  let clean = '';
  let inString = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      clean += ch;
      if (ch === '\\') clean += input[++i] ?? '';
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      clean += ch;
    } else if (ch === '/' && input[i + 1] === '/') {
      clean += ' ';
      i += 2;
      while (i < input.length && !/[\r\n]/.test(input[i])) i += 1;
      clean += input[i] ?? '';
    } else if (ch === '/' && input[i + 1] === '*') {
      clean += ' ';
      i += 2;
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) {
        if (/[\r\n]/.test(input[i])) clean += input[i];
        i += 1;
      }
      if (i >= input.length) throw new SyntaxError('Unterminated JSONC block comment');
      i += 1;
    } else clean += ch;
  }
  let normalized = '';
  inString = false;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (inString) {
      normalized += ch;
      if (ch === '\\') normalized += clean[++i] ?? '';
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      normalized += ch;
    } else if (ch === ',' && /^\s*[}\]]/.test(clean.slice(i + 1))) {
      // Only a comma outside a quoted string can be a trailing comma.
    } else normalized += ch;
  }
  return JSON.parse(normalized);
}
