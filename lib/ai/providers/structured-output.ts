import type { ChatCompletionOptions } from '../types';

function requestsJson(options: ChatCompletionOptions): boolean {
  return options.messages.some((message) => {
    const content = typeof message.content === 'string' ? message.content : '';
    return /return\s+only\s+valid\s+json|return\s+json\s+only|respond\s+with\s+(?:only\s+)?(?:valid\s+)?json|return\s+only\s+json/i.test(content);
  });
}

function extractBalancedJson(input: string): string {
  const source = input
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const objectStart = source.indexOf('{');
  const arrayStart = source.indexOf('[');
  let start = -1;
  if (objectStart >= 0 && arrayStart >= 0) start = Math.min(objectStart, arrayStart);
  else start = Math.max(objectStart, arrayStart);
  if (start < 0) return source;

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') stack.push('}');
    else if (char === '[') stack.push(']');
    else if ((char === '}' || char === ']') && stack.length) {
      const expected = stack[stack.length - 1];
      if (char !== expected) continue;
      stack.pop();
      if (stack.length === 0) return source.slice(start, index + 1);
    }
  }

  return source.slice(start).trim();
}

function escapeLiteralControlsInStrings(input: string): string {
  let result = '';
  let inString = false;
  let escaped = false;

  for (const char of input) {
    if (!inString) {
      result += char;
      if (char === '"') inString = true;
      continue;
    }

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }
    if (char === '"') {
      result += char;
      inString = false;
      continue;
    }

    const code = char.charCodeAt(0);
    if (code < 0x20) {
      if (char === '\n') result += '\\n';
      else if (char === '\r') result += '\\r';
      else if (char === '\t') result += '\\t';
      else if (char === '\b') result += '\\b';
      else if (char === '\f') result += '\\f';
      else result += `\\u${code.toString(16).padStart(4, '0')}`;
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Open-weight/low-cost models sometimes prepend prose to a JSON response or
 * emit literal newlines/control characters inside JSON strings. When the
 * request explicitly requires JSON, normalize only those transport-level
 * defects. Schema/business validation remains the caller's responsibility.
 */
export function normalizeStructuredOutput(
  content: string,
  options: ChatCompletionOptions,
): string {
  if (!requestsJson(options)) return content;
  return escapeLiteralControlsInStrings(extractBalancedJson(content));
}
