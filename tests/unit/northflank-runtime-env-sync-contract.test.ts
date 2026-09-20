import { readFileSync } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('Northflank runtime environment synchronization contract', () => {
  it('preserves existing variables before applying workflow values', () => {
    const sync = read('scripts/northflank/sync-env.ts');

    expect(sync).toContain('const existingVariables =');
    expect(sync).toContain('{ ...existingVariables, ...variables }');
    expect(sync).toContain('preserved ${Object.keys(existingVariables).length} existing variables');
  });

  it('carries every supported AI and licensed-media credential alias', () => {
    const manifest = read('scripts/northflank/env-keys-manifest.txt')
      .split('\n')
      .map((key) => key.trim())
      .filter(Boolean);

    expect(manifest).toEqual(
      expect.arrayContaining([
        'XAI_API_KEY',
        'XAI_API_TOKEN',
        'GROK_API_KEY',
        'GROK_API_TOKEN',
        'ANTHROPIC_API_KEY',
        'ANTHROPIC_API_TOKEN',
        'CLAUDE_API_KEY',
        'ENVATO_API_TOKEN',
      ]),
    );
    expect(new Set(manifest).size).toBe(manifest.length);
  });

  it('maps provider credentials into both Admin and full production deploys', () => {
    const admin = read('.github/workflows/deploy-admin.yml');
    const production = read('.github/workflows/deploy-production.yml');

    for (const workflow of [admin, production]) {
      expect(workflow).toContain('XAI_API_KEY: ${{ secrets.XAI_API_KEY }}');
      expect(workflow).toContain('ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}');
      expect(workflow).toContain('ENVATO_API_TOKEN: ${{ secrets.ENVATO_API_TOKEN }}');
    }
    expect(admin).toContain('pnpm tsx scripts/northflank/sync-env.ts --execute');
  });
});
