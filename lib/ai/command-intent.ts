/** Distinguish a diagnostic first phase from a read-only constraint on the whole request. */
export function isReadOnlyRequest(command: string): boolean {
  const scope = command.replace(
    /\b(?:begin|start)\s+with\s+(?:a\s+)?read[- ]?only\s+(?=baseline\b|checks?\b|inspection\b|diagnostics?\b)/gi,
    '',
  );
  return /\bread[- ]?only\b/i.test(scope);
}
