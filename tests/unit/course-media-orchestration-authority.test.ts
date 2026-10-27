import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('course media orchestration authority', () => {
  it('keeps renderers behind the single narration adapter', () => {
    const renderer = readFileSync('lib/video/remotion-render.ts', 'utf8');
    expect(renderer).toContain("from './edge-tts'");
    expect(renderer).not.toMatch(/api\.elevenlabs\.io|generativelanguage\.googleapis\.com|audio\.speech\.create/);
  });

  it('does not contain a hidden production provider fallback chain', () => {
    const adapter = readFileSync('lib/video/edge-tts.ts', 'utf8');
    expect(adapter).toContain('configuredNarrationProvider');
    expect(adapter).toContain('no provider bypass was attempted');
    expect(adapter).not.toContain('trying Gemini');
    expect(adapter).not.toContain('trying OpenAI');
    expect(adapter).not.toContain('trying Edge TTS');
  });
});
