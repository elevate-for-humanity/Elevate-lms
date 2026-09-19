const ANTHROPIC_KEY_ALIASES = [
  'ANTHROPIC_API_KEY',
  'CLAUDE_API_KEY',
  'ANTHROPIC_API_TOKEN',
] as const;

export function getAnthropicAPIKey(): string {
  for (const key of ANTHROPIC_KEY_ALIASES) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return '';
}

export function isAnthropicConfigured(): boolean {
  return getAnthropicAPIKey().length >= 12;
}
