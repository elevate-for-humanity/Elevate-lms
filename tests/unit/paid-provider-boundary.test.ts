import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const providerSdkModules = [
  'lib/ai/openai-client.ts',
  'lib/ai/groq-client.ts',
  'lib/groq-client.ts',
  'lib/ai/providers/openai.ts',
  'lib/ai/providers/groq.ts',
  'lib/ai/anthropic-client.ts',
  'lib/gemini-client.ts',
];

describe('paid provider boundary', () => {
  it.each(providerSdkModules)('%s fails closed outside the paid inference gateway', (file) => {
    const source = readFileSync(file, 'utf8');
    expect(source).toContain('requirePaidInferenceContext');
    expect(source).toMatch(
      /requirePaidInferenceContext\(['"](?:openai|groq|anthropic|gemini)['"]\)/,
    );
  });

  it('keeps every Course Builder generation and media dispatch inside the gateway', () => {
    const generation = readFileSync('apps/admin/app/api/admin/course-builder/route.ts', 'utf8');
    const canonicalGeneration = readFileSync(
      'apps/admin/app/api/admin/courses/generate/route.ts',
      'utf8',
    );
    const blueprintGeneration = readFileSync(
      'apps/admin/app/api/admin/generate-course/route.ts',
      'utf8',
    );
    const media = readFileSync('lib/video/process-video-job.ts', 'utf8');
    const studioBrowser = readFileSync(
      'apps/admin/app/api/admin/dev-studio/browser/agent/route.ts',
      'utf8',
    );
    for (const source of [
      generation,
      canonicalGeneration,
      blueprintGeneration,
      media,
      studioBrowser,
    ]) {
      expect(source).toContain('reservePaidInference');
      expect(source).toContain('executePaidInference');
    }
  });
});
