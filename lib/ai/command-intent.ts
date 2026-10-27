/** Explicit conversational constraints take precedence over action keywords. */
export function prohibitsToolUse(command: string): boolean {
  return /\b(?:do not|don['’]?t|never)\s+(?:use|call|run|invoke|execute)\s+(?:any\s+)?tools?\b|\b(?:without\s+(?:using\s+)?(?:any\s+)?tools?|no\s+tool\s+(?:use|calls?)|tool[- ]free)\b/i.test(command);
}

/** Ignore prohibited action lists, including comma-separated lists. Keep a
 * subsequent affirmative clause ("but fix …") available to the planner. */
export function affirmativeActionText(command: string): string {
  return command.replace(/\b(?:do not|don['’]?t|never)\b[^.;\n]*?(?=\b(?:but|then)\b|[.;\n]|$)/gi, ' ');
}

/** Distinguish a diagnostic first phase from a read-only constraint on the whole request. */
export function isReadOnlyRequest(command: string): boolean {
  const scope = command.replace(
    /\b(?:begin|start)\s+with\s+(?:a\s+)?read[- ]?only\s+(?=baseline\b|checks?\b|inspection\b|diagnostics?\b)/gi,
    '',
  );
  return /\bread[- ]?only\b/i.test(scope);
}
