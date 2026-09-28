import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Admin native inference build contract', () => {
  it('keeps Kokoro and ONNX runtime packages outside the webpack bundle', () => {
    const config = readFileSync(resolve(process.cwd(), 'apps/admin/next.config.mjs'), 'utf8');

    for (const packageName of [
      'kokoro-js',
      '@huggingface/transformers',
      'onnxruntime-node',
      'onnxruntime-common',
      'onnxruntime-web',
    ]) {
      expect(config).toContain(`'${packageName}'`);
    }
  });
});
