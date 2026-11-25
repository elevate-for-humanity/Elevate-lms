import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('PARIS-owned inference default across Admin and learner surfaces', () => {
  const read = (path: string) => readFileSync(path, 'utf8');

  it('does not autodiscover externally billed models in shared AI service', () => {
    const source = read('lib/ai/ai-service.ts');
    expect(source).toContain("const PROVIDER_DISCOVERY_ORDER = ['elevate'];");
    expect(source).toContain("options.providerPolicy === 'owned-only'");
  });

  it('keeps Studio inference on the owned engine even when it is unreachable', () => {
    const source = read('apps/admin/app/api/admin/dev-studio/chat/route.ts');
    expect(source).not.toContain("providerPreference === 'auto' ? 'openai'");
    // Owned-only streaming policy is preserved for a reachable owned model.
    expect(source).toContain("providerPolicy: 'owned-only'");
    expect(source).toContain("code: 'OWNED_MODEL_UNAVAILABLE'");
    expect(source).toContain('return studioTextStreamResponse({');
    expect(source).toContain('Paris could not complete this response. No outside AI provider was used.');
    expect(source).toContain('isOwnedStudioProviderRequest');
    expect(source).not.toContain('governedExternalCompletion');
    expect(source).not.toContain('executePaidInference');
  });

  it('keeps learner chat on owned-only inference', () => {
    const source = read('apps/lms/app/api/ai-chat/route.ts');
    expect(source).toContain("providerPolicy: 'owned-only'");
  });

  it('keeps private model deployment separate from selecting the provider', () => {
    const source = read('scripts/gcp/deploy-owned-llm.mjs');
    expect(source).toContain("'--min-instances','0'");
    expect(source).toContain("'--max-instances','1'");
    const config = read('services/llm-gpu-worker/Dockerfile.google');
    expect(config).toContain('vllm');
  });
});
