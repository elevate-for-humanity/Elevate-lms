import { rm, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * @param {string} nodeModulesDir
 * @param {string[]} prunePackages
 * @param {string} logPrefix
 */
export async function pruneStandaloneNodeModules(nodeModulesDir, prunePackages, logPrefix) {
  if (!existsSync(nodeModulesDir)) {
    console.log(`[${logPrefix}] ${nodeModulesDir} does not exist — skipping`);
    return;
  }

  let totalRemoved = 0;

  for (const pkg of prunePackages) {
    const pkgPath = join(nodeModulesDir, pkg);
    if (existsSync(pkgPath)) {
      try {
        await rm(pkgPath, { recursive: true, force: true });
        totalRemoved++;
        console.log(`[${logPrefix}] removed ${pkg}`);
      } catch (err) {
        console.warn(`[${logPrefix}] failed to remove ${pkg}: ${err.message}`);
      }
    }
  }

  const pnpmDir = join(nodeModulesDir, '.pnpm');
  if (existsSync(pnpmDir)) {
    const entries = await readdir(pnpmDir);
    for (const entry of entries) {
      const shouldPrune = prunePackages.some((pkg) => {
        if (pkg.startsWith('@')) {
          const slash = pkg.indexOf('/');
          if (slash > 0) {
            const scoped = pkg.slice(1).replace('/', '+') + '@';
            return entry.startsWith(scoped);
          }
          // @esbuild → @esbuild+linux-x64@…, @remotion → @remotion+…
          return entry.startsWith(`${pkg}+`) || entry.startsWith(`${pkg.slice(1)}+`);
        }
        return entry.startsWith(`${pkg}@`) || entry === pkg;
      });
      if (shouldPrune) {
        try {
          await rm(join(pnpmDir, entry), { recursive: true, force: true });
          totalRemoved++;
          console.log(`[${logPrefix}] removed .pnpm/${entry}`);
        } catch (err) {
          console.warn(`[${logPrefix}] failed to remove .pnpm/${entry}: ${err.message}`);
        }
      }
    }
  }

  console.log(`[${logPrefix}] done — removed ${totalRemoved} entries from ${nodeModulesDir}`);
}
