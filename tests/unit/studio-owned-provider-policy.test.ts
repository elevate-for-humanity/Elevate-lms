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
it('rejects vendor selections and reports owned-engine outages before starting Studio work', () => {
  const source = readFileSync('apps/admin/app/api/admin/dev-studio/chat/route.ts','utf8');
  expect(source.indexOf('if (!isOwnedStudioProviderRequest(rawProvider))')).toBeLessThan(source.indexOf('const masterDb = await requireAdminClient();'));
  const start = source.indexOf('const owned = await ownedModelReachable();');
  const end = source.indexOf('const masterDb = await requireAdminClient();');
  expect(start).toBeGreaterThan(-1);
  expect(start).toBeLessThan(end);
  const block = source.slice(start, end);
  expect(block).toContain("code: 'OWNED_MODEL_UNAVAILABLE'");
  expect(block).toContain('status: 503');
  expect(source).not.toContain('governedExternalCompletion(');
  expect(source).not.toContain('executePaidInference');
});
