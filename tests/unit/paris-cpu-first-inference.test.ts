import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
describe('PARIS private CPU first inference', () => {
 const source=readFileSync('lib/ai/providers/elevate.ts','utf8');
 it('routes default inference to CPU and requires explicit GPU opt in',()=>{
  expect(source).toContain("process.env.PARIS_GPU_ENABLED === 'true'");
  expect(source).toContain("process.env.PARIS_INFERENCE_TIER === 'gpu'");
  expect(source).toContain('process.env.ELEVATE_LLM_CPU_URL || process.env.ELEVATE_LLM_URL');
  expect(source).toContain('process.env.ELEVATE_LLM_CPU_SECRET || process.env.ELEVATE_LLM_SECRET');
 });
 it('does not start GPU instances in the inference adapter',()=>{
  expect(source).not.toContain('gcloud run deploy');
  expect(source).not.toContain('run.googleapis.com/v2');
 });
});
