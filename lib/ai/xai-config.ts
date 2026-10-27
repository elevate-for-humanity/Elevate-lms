import 'server-only';

/** Resolve xAI credentials from the official name and supported legacy aliases. */
export function getXAIAPIKey(): string {
  return (
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.XAI_API_TOKEN ||
    process.env.GROK_API_TOKEN ||
    ''
  ).trim();
}

export function isXAIConfigured(): boolean {
  return getXAIAPIKey().length >= 12;
}
