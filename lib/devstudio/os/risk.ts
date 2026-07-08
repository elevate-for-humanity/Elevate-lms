const RISKY_KEYWORDS = [
  'migration',
  'deploy',
  'payment',
  'auth',
  'delete',
  'drop',
  'truncate',
  'production',
] as const;

export function detectRiskTags(text: string): string[] {
  const lower = text.toLowerCase();
  return RISKY_KEYWORDS.filter((kw) => lower.includes(kw));
}

export function requiresApproval(text: string): boolean {
  return detectRiskTags(text).length > 0;
}

export function approvalReason(tags: string[]): string {
  if (!tags.length) return '';
  return `Risky operation detected: ${tags.join(', ')}. Admin approval required before execution.`;
}
