import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';

describe('export-admin-pdf-deps.mjs', () => {
  it('exports pdf-parse with package.json at package root', () => {
    const exportRoot = mkdtempSync(join(tmpdir(), 'pdf-export-'));
    execSync('node scripts/export-admin-pdf-deps.mjs', {
      cwd: process.cwd(),
      env: { ...process.env, EXPORT_ROOT: exportRoot },
      stdio: 'pipe',
    });

    expect(existsSync(join(exportRoot, 'pdf-node_modules', 'pdf-parse', 'package.json'))).toBe(
      true,
    );
    expect(existsSync(join(exportRoot, 'pdf-node_modules', '@napi-rs', 'canvas', 'package.json'))).toBe(
      true,
    );
  });
});
