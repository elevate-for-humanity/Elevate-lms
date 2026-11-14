/**
 * Remotion webpack bundle cache — lazy, on-demand only.
 * Reference-counted release so concurrent renders do not delete a shared bundle.
 */

import path from 'node:path';
import { rm } from 'node:fs/promises';
import { bundle } from '@remotion/bundler';
import { logger } from '@/lib/logger';

let _bundleUrl: string | null = null;
let _bundleRefCount = 0;

const DEFAULT_ENTRY = path.join(process.cwd(), 'remotion-src', 'index.ts');

async function ensureRemotionBundle(entryPoint: string = DEFAULT_ENTRY): Promise<string> {
  if (_bundleUrl) return _bundleUrl;

  logger.info('[RemotionBundle] Bundling composition (first use this process)...');
  _bundleUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => ({
      ...config,
      externals: [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'edge-tts',
      ],
    }),
  });
  logger.info('[RemotionBundle] Bundle ready');
  return _bundleUrl;
}

/**
 * Hold the shared bundle for one render job. Call once per concurrent render (or once per batch).
 */
export async function retainRemotionBundle(
  entryPoint: string = DEFAULT_ENTRY,
): Promise<string> {
  _bundleRefCount++;
  return ensureRemotionBundle(entryPoint);
}

/** @deprecated Prefer retainRemotionBundle — does not increment ref count. */
export async function getRemotionBundleUrl(
  entryPoint: string = DEFAULT_ENTRY,
): Promise<string> {
  return ensureRemotionBundle(entryPoint);
}

/**
 * Release one hold on the bundle. Deletes only this process's bundle directory when the last hold ends.
 */
export async function releaseRemotionBundle(): Promise<void> {
  if (_bundleRefCount > 0) {
    _bundleRefCount--;
  }

  if (_bundleRefCount > 0) {
    return;
  }

  const bundlePath = _bundleUrl;
  _bundleUrl = null;

  if (!bundlePath) {
    return;
  }

  await rm(bundlePath, { recursive: true, force: true }).catch((err) => {
    logger.warn('[RemotionBundle] Failed to remove bundle directory', {
      bundlePath,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  logger.info('[RemotionBundle] Released bundle cache', { bundlePath });
}

/** Default: release after each render/batch unless explicitly disabled. */
export function shouldReleaseRemotionBundleAfterJob(): boolean {
  return process.env.REMOTION_RELEASE_BUNDLE_AFTER_RENDER !== 'false';
}

/** @internal Test-only reset */
export function _resetRemotionBundleCacheForTests(): void {
  _bundleUrl = null;
  _bundleRefCount = 0;
}

/** @internal Test-only introspection */
export function _getRemotionBundleRefCountForTests(): number {
  return _bundleRefCount;
}
