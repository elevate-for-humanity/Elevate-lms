import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('PARIS private CPU first inference', () => {
 const source=readFileSync('lib/ai/providers/owned-model-config.mjs','utf8');
 it('routes default inference to CPU and requires explicit GPU opt in',()=>{
  expect(source).toContain("env.PARIS_GPU_ENABLED === 'true'");
  expect(source).toContain("env.PARIS_INFERENCE_TIER === 'gpu'");
  expect(source).toContain('env.ELEVATE_LLM_CPU_URL || env.ELEVATE_LLM_URL');
  expect(source).toContain('env.ELEVATE_LLM_CPU_SECRET || env.ELEVATE_LLM_SECRET');
 });
 it('does not start GPU instances in the inference adapter',()=>{
  expect(source).not.toContain('gcloud run deploy');
  expect(source).not.toContain('run.googleapis.com/v2');
 });
});
