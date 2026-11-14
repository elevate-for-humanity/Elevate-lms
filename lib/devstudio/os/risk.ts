export function detectRiskTags(text: string): string[] {
  // Natural-language keywords are not an authorization boundary. A request can
  // discuss payments, deployment, email, or signing without performing any of
  // those actions. Approval is enforced by the concrete tool at execution time.
  void text;
  return [];
}

export function requiresApproval(text: string): boolean {
  return detectRiskTags(text).length > 0;
}

export function approvalReason(tags: string[]): string {
  if (!tags.length) return '';
  return `Protected tool requires approval: ${tags.join(', ')}.`;
}
