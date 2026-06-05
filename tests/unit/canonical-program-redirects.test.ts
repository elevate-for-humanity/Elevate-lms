import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { STATIC_PROGRAM_MAP } from '@/data/programs/index';

const ROOT = process.cwd();
const config = JSON.parse(
  readFileSync(join(ROOT, 'lib/routes/canonical-routes.json'), 'utf8'),
) as {
  legacyAliases: Array<{ source: string; destination: string }>;
};

const protectedSlugs = new Set(STATIC_PROGRAM_MAP.keys());
const programsDir = join(ROOT, 'app/programs');
for (const entry of readdirSync(programsDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('[')) continue;
  if (existsSync(join(programsDir, entry.name, 'page.tsx'))) {
    protectedSlugs.add(entry.name);
  }
}

describe('canonical program redirects', () => {
  it('does not send live program slugs to the catalog root', () => {
    const bad: string[] = [];
    for (const alias of config.legacyAliases) {
      if (alias.destination !== '/programs') continue;
      const match = alias.source.match(/^\/programs\/([^/]+)$/);
      if (!match) continue;
      const slug = match[1];
      if (protectedSlugs.has(slug)) bad.push(alias.source);
    }
    expect(bad).toEqual([]);
  });
});
