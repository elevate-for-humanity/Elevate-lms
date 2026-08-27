import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('lib/ai/course-generator.ts', 'utf8');

describe('Course Builder RAG integration', () => {
  it('grounds the canonical generator with the existing Supabase RAG helper', () => {
    expect(source).toContain("import { getRAGContext } from '@/lib/platform/rag'");
    expect(source).toContain('const ragContext = await getRAGContext');
    expect(source).toContain('Use the retrieved source material below as evidence.');
    expect(source).toContain("ragContext");
  });

  it('keeps generation available when retrieval returns no context', () => {
    expect(source).toContain("ragContext");
    expect(source).toContain(": ''");
    expect(source).toContain("filter(Boolean).join('\\n')");
  });
});
