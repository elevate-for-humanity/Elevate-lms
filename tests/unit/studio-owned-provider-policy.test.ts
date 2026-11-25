// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { isOwnedStudioProviderRequest } from '@/lib/devstudio/owned-provider-policy';
it.each([undefined,null,'','auto','elevate',' ELEVATE '])('accepts owned Studio selection %s', provider => {
  expect(isOwnedStudioProviderRequest(provider)).toBe(true);
});
it.each(['openai','cloudflare','groq','gemini','anthropic','xai',[],{},'unknown'])('rejects external/invalid selection %s', provider => {
  expect(isOwnedStudioProviderRequest(provider)).toBe(false);
});
it('blocks external selections before execution and returns an outage before external fallback', () => {
  const source = readFileSync('apps/admin/app/api/admin/dev-studio/chat/route.ts','utf8');
  expect(source.indexOf('if (!isOwnedStudioProviderRequest(rawProvider))')).toBeLessThan(source.indexOf('const masterDb = await requireAdminClient();'));
  const start = source.indexOf('// An owned-model outage');
  const block = source.slice(start,source.indexOf('// True model streaming',start));
  expect(block).toContain("code: 'OWNED_MODEL_UNAVAILABLE'");
  expect(block).toContain('status: 503');
  expect(block).not.toContain('governedExternalCompletion(');
  expect(source).not.toContain('governedExternalCompletion(');
  expect(source).not.toContain('GOVERNED_PROVIDER_FACTORIES');
});
