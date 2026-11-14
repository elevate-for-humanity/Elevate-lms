// scripts/fix-client-reference-manifests.mjs
//
// Ensures page_client-reference-manifest.js files exist for standalone output
// (underscore) alongside every page.js in .next/server/app/.
// Next.js 15 either:
//   (a) produces page.client-reference-manifest.js (dot) — needs copying, or
//   (b) produces no manifest at all for simple server pages — needs empty shim
//
// This script handles both cases so the plugin's copyfile step doesn't ENOENT.

import fs from 'node:fs';
import path from 'node:path';

const SERVER_APP = path.join(process.cwd(), '.next', 'server', 'app');

if (!fs.existsSync(SERVER_APP)) {
  console.log('[fix-manifests] .next/server/app not found — skipping (run after next build)');
  process.exit(0);
}

// Minimal valid client-reference-manifest content
const EMPTY_MANIFEST = `self.__RSC_MANIFEST={}`;

let fixed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'page.js') {
      const dotManifest = path.join(dir, 'page.client-reference-manifest.js');
      const underscoreManifest = path.join(dir, 'page_client-reference-manifest.js');

      if (!fs.existsSync(underscoreManifest)) {
        if (fs.existsSync(dotManifest)) {
          fs.copyFileSync(dotManifest, underscoreManifest);
          console.log(`[fix-manifests] copied  → page_client-reference-manifest.js in ${path.relative(SERVER_APP, dir)}`);
        } else {
          fs.writeFileSync(underscoreManifest, EMPTY_MANIFEST);
          console.log(`[fix-manifests] shimmed → page_client-reference-manifest.js in ${path.relative(SERVER_APP, dir)}`);
        }
        fixed++;
      }
    }
  }
}

walk(SERVER_APP);
console.log(`[fix-manifests] done — ${fixed} manifest(s) created`);
