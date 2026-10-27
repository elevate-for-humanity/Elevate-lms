// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Platform health Studio Browser coverage', () => {
  it('probes and displays the isolated browser runtime', () => {
    const health = read('lib/platform/platform-health.ts');
    const client = read('apps/admin/app/system-health/SystemHealthClient.tsx');

    expect(health).toContain('async function checkStudioBrowser()');
    expect(health).toContain("fetch(`${url}/health`");
    expect(health).toContain('studioBrowser: ServiceCheck');
    expect(health).toContain('services.studioBrowser');
    expect(client).toContain("'Studio Browser': Wifi");
  });
});
