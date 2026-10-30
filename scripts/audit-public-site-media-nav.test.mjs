import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const audit = fs.readFileSync(new URL('./audit-public-site-media-nav.mjs', import.meta.url), 'utf8');

function runAudit(href, asset) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'public-media-audit-'));
  const write = (name, content) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  };
  try {
    write('scripts/audit.mjs', audit);
    write('lib/media/legacy-image-aliases.mjs', 'export const LEGACY_IMAGE_ALIASES = {};');
    write('lib/navigation/public-route-registry.ts', "export const routes = [{ path: '/programs/hvac-technician' }];");
    write('apps/marketing/app/sitemap.ts', 'export default function sitemap() {}');
    write('apps/marketing/app/programs/hvac-technician/page.tsx',
      '<video controls poster="/images/poster.webp"><source src="/videos/hero.mp4" /></video><a href="' + href + '">Watch the HVAC video</a>');
    write('public/images/poster.webp', 'fixture poster');
    if (asset) write(asset, 'fixture media');
    return spawnSync(process.execPath, ['scripts/audit.mjs'], { cwd: root, encoding: 'utf8' });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('existing video and audio links are assets, including query strings', () => {
  for (const ext of ['mp4', 'webm', 'mov', 'm4v', 'mp3', 'm4a', 'wav', 'ogg', 'aac']) {
    const result = runAudit('/videos/hero.' + ext + '?download=1#media', 'public/videos/hero.' + ext);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /Broken\/placeholder canonical actions: 0/);
  }
});

test('missing MP4 still blocks acceptance as a missing public asset', () => {
  const result = runAudit('/videos/missing.mp4');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /linked public asset missing/);
});

test('missing page routes still block acceptance', () => {
  const result = runAudit('/programs/missing');
  assert.equal(result.status, 1);
  assert.match(result.stdout, /marketing destination route missing/);
});
