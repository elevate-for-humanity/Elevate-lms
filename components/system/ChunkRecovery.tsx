'use client';

import { useEffect } from 'react';
import { installChunkRecovery } from '@/lib/browser/chunk-recovery-bootstrap';

export const CHUNK_RELOAD_KEY = 'elevate-chunk-reload';

export function reloadWithFreshBuild() {
  const url = new URL(window.location.href);
  url.searchParams.set('__elevate_reload', Date.now().toString());
  window.location.replace(url.toString());
}

export function ChunkRecovery() {
  useEffect(() => installChunkRecovery(window), []);

  return null;
}
