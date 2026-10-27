/** Runs before React loads, so a missing layout chunk cannot disable recovery. */
export function installChunkRecovery(win: Window & typeof globalThis): () => void {
  const key = 'elevate-chunk-reload';
  const recover = () => {
    try {
      const previous = Number(win.sessionStorage.getItem(key) || '0');
      if (Date.now() - previous < 120000) return;
      win.sessionStorage.setItem(key, String(Date.now()));
      const url = new URL(win.location.href);
      url.searchParams.set('__elevate_reload', String(Date.now()));
      win.location.replace(url.toString());
    } catch {
      // Storage-disabled browsers must not enter an uncontrolled reload loop.
    }
  };
  const failedChunk = (value: unknown) => {
    const message = value instanceof Error ? value.message : String(value || '');
    return /ChunkLoadError|Loading (?:CSS )?chunk|Failed to fetch dynamically imported module/i.test(
      message,
    );
  };
  const error = (event: Event) => {
    const target = event.target;
    if (target instanceof win.HTMLScriptElement || target instanceof win.HTMLLinkElement) {
      const src = target instanceof win.HTMLScriptElement ? target.src : target.href;
      const asset = new URL(src, win.location.href);
      if (
        asset.origin === new URL(win.location.href).origin &&
        asset.pathname.startsWith('/_next/static/')
      )
        recover();
    } else if (failedChunk((event as ErrorEvent).error || (event as ErrorEvent).message)) recover();
  };
  const rejection = (event: PromiseRejectionEvent) => {
    if (failedChunk(event.reason)) recover();
  };
  win.addEventListener('error', error, true);
  win.addEventListener('unhandledrejection', rejection);
  return () => {
    win.removeEventListener('error', error, true);
    win.removeEventListener('unhandledrejection', rejection);
  };
}

export function chunkRecoveryBootstrap(): string {
  return `(${installChunkRecovery.toString()})(window);`;
}
