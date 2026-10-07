/**
 * Return actionable Studio errors to authenticated administrators.
 *
 * Keep credential-bearing upstream diagnostics out of the conversational UI.
 * Return the operational category and next action; detailed evidence belongs
 * in the service's redacted diagnostic records.
 */
export function studioUserFacingError(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value ?? '');
  if (!raw.trim()) return 'The operation did not complete. Review its evidence or retry it.';

  if (/PAID_INFERENCE_AUTHORIZATION_REQUIRED/i.test(raw)) {
    return 'This capability needs authorization before paid inference can run.';
  }
  if (/NoCredentialsError|\b401\b|unauthorized|missing.*(?:token|credential|api.?key)/i.test(raw)) {
    return 'The selected capability is not connected. Configure its service credentials and retry.';
  }
  if (/OpenHands|DeepSeek|OpenAI|Anthropic|Gemini/i.test(raw)) {
    return 'The internal AI capability could not complete the request. Review its service health and retry.';
  }
  // Never echo credential-bearing upstream JSON into the conversational UI.
  if (/token|password|secret|authorization|api[_ -]?key/i.test(raw)) {
    return 'The capability encountered a credential configuration error. Review its configuration.';
  }
  return raw.slice(0, 1200);
}

export function studioUserFacingToolName(value: string | null | undefined): string {
  if (!value) return 'Studio capability';
  if (value === 'openhands.engineering') return 'Engineering capability';
  if (/^(openai|deepseek|anthropic|gemini)\./.test(value)) return 'AI capability';
  return value;
}
