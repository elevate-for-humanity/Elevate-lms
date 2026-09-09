const RISKY_KEYWORDS = [
  'migration',
  'deploy',
  'payment',
  'auth',
  'delete',
  'drop',
  'truncate',
  'production',
  'buy',
  'purchase',
  'checkout',
  'pay',
  'remove',
  'publish',
  'merge',
  'push',
  'send',
  'email',
  'message',
  'submit application',
  'sign',
] as const;

export function detectRiskTags(text: string): string[] {
  const lower = text.toLowerCase();
  return RISKY_KEYWORDS.filter((keyword) => {
    // Whole-word matching prevents tags such as `pay` from firing inside
    // ordinary read-only words such as `deployment`.
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const keywordPattern = new RegExp(`\\b${escaped}\\b`, 'g');
    const nextIndex = (from: number) => {
      keywordPattern.lastIndex = from;
      return keywordPattern.exec(lower)?.index ?? -1;
    };
    let index = nextIndex(0);
    while (index >= 0) {
      const clauseStart = Math.max(
        lower.lastIndexOf('.', index),
        lower.lastIndexOf(';', index),
        lower.lastIndexOf('\n', index),
      );
      const prefix = lower.slice(clauseStart + 1, index);
      const suffix = lower.slice(index + keyword.length, index + keyword.length + 24);
      // Inspecting a protected workflow is not the same as executing it.
      // Noun phrases such as "publish flow" and "deployment status" stay read-only.
      if (
        /^\s*(?:flow|status|history|logs?|button|control|settings?|configuration|readiness|failure)/.test(
          suffix,
        )
      ) {
        index = nextIndex(index + keyword.length);
        continue;
      }
      const lastNegation = Math.max(
        prefix.lastIndexOf('do not'),
        prefix.lastIndexOf("don't"),
        prefix.lastIndexOf('never'),
        prefix.lastIndexOf('without'),
        prefix.lastIndexOf('avoid'),
      );
      const afterNegation = lastNegation >= 0 ? prefix.slice(lastNegation) : '';
      const negationReset = /\b(?:but|then|instead|however)\b/.test(afterNegation);
      if (lastNegation < 0 || negationReset) return true;
      index = nextIndex(index + keyword.length);
    }
    return false;
  });
}

export function requiresApproval(text: string): boolean {
  return detectRiskTags(text).length > 0;
}

export function approvalReason(tags: string[]): string {
  if (!tags.length) return '';
  return `Risky operation detected: ${tags.join(', ')}. Admin approval required before execution.`;
}
