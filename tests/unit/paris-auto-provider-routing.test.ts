import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Dev Studio PARIS provider selection', () => {
  it('does not auto-route chat to OpenAI API credits', () => {
    const source = readFileSync('apps/admin/app/api/admin/dev-studio/chat/route.ts', 'utf8');
    expect(source).not.toContain("providerPreference === 'auto' ? 'openai'");
    expect(source).toContain("providerPreference === 'auto' ? (isGroqConfigured() ? 'groq' : isGeminiConfigured() ? 'gemini' : 'auto')");
    expect(source).toContain('const providerOrder = [effectiveProvider]');
  });
});
