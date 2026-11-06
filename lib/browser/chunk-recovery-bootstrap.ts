/** Runs before React loads, so a missing layout chunk cannot disable recovery. */
export function installChunkRecovery(win: Window & typeof globalThis): () => void {
  const key = 'elevate-chunk-reload';
  let navigation: { from: string; to: string; at: number } | undefined;
  const click = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    const anchor = event.target instanceof win.Element ? event.target.closest('a[href]') : null;
    if (
      !anchor ||
      anchor.hasAttribute('download') ||
      (anchor.getAttribute('target') && anchor.getAttribute('target') !== '_self')
    )
      return;
    try {
      const current = new URL(win.location.href);
      const target = new URL(anchor.getAttribute('href') || '', current);
      if (
        target.origin !== current.origin ||
        target.pathname + target.search === current.pathname + current.search
      )
        return;
      navigation = { from: current.href, to: target.href, at: Date.now() };
    } catch {
      // A malformed link must not break unrelated page interactions.
    }
  };
  const recover = () => {
    try {
      const previous = Number(win.sessionStorage.getItem(key) || '0');
      if (Date.now() - previous < 120000) return;
      win.sessionStorage.setItem(key, String(Date.now()));
      // During an App Router transition location still names the old page.
      // Recover the user's same-origin destination, rather than silently
      // taking them back to the form they just left.
      const destination =
        navigation && navigation.from === win.location.href && Date.now() - navigation.at < 15000
          ? navigation.to
          : win.location.href;
      const url = new URL(destination);
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
  win.addEventListener('click', click, true);
  return () => {
    win.removeEventListener('error', error, true);
    win.removeEventListener('unhandledrejection', rejection);
    win.removeEventListener('click', click, true);
  };
}

export function chunkRecoveryBootstrap(): string {
  return `(${installChunkRecovery.toString()})(window);`;
}
