/**
 * Provider and infrastructure details belong in the protected audit record,
 * not in the LIZZY conversation. Keep these messages deterministic so the UI
 * remains useful even when every inference provider is unavailable.
 */
export function studioUserFacingError(value: unknown): string {
  const raw = value instanceof Error ? value.message : String(value ?? '');
  if (!raw.trim()) return 'The operation did not complete. Review its evidence or retry it.';

  if (/paid[_\s-]?inference[_\s-]?authorization[_\s-]?required/i.test(raw)) {
    return 'This step needs authorization to use a paid AI capability. Approve that specific step or choose an available deterministic capability.';
  }
  if (
    /nocredentialserror|api\s*401|unauthorized.*(?:api|provider)|(?:api|access)[_\s-]?key.*(?:missing|not configured|required)/i.test(
      raw,
    )
  ) {
    return 'The selected capability is not connected. LIZZY can continue with available tools, or an administrator can connect that capability in Integrations.';
  }
  if (/openhands|deepseek|anthropic|openai|gemini|groq|cloudflare workers ai|vllm/i.test(raw)) {
    return 'An internal AI capability did not complete this step. LIZZY preserved the task and its protected diagnostic evidence for retry.';
  }
  return raw
    .replace(
      /\b(?:OpenHands|DeepSeek|Anthropic|OpenAI|Gemini|Groq|vLLM)\b/gi,
      'internal capability',
    )
    .slice(0, 1200);
}

export function studioUserFacingToolName(value: string | null | undefined): string {
  if (!value) return 'Studio capability';
  if (/openhands/i.test(value)) return 'Engineering capability';
  if (/deepseek|anthropic|openai|gemini|groq|vllm/i.test(value)) return 'AI capability';
  return value;
}
