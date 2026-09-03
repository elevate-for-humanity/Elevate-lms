'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

function useEmbedCheck(url: string) {
  const [state, setState] = useState<{ embeddable: boolean | null; reason?: string }>({ embeddable: null });

  useEffect(() => {
    if (!url) return;
    setState({ embeddable: null });
    const controller = new AbortController();
    fetch(`/api/admin/dev-studio/embed-check?url=${encodeURIComponent(url)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { embeddable: boolean; reason?: string }) => setState(d))
      .catch(() => setState({ embeddable: true }));
    return () => controller.abort();
  }, [url]);

  return state;
}

export function LivePreviewIframe({
  url,
  device = 'desktop',
  minHeight = 320,
  refreshKey = 0,
}: {
  url: string;
  device?: PreviewDevice;
  minHeight?: number;
  refreshKey?: number;
}) {
  const { embeddable, reason } = useEmbedCheck(url);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
  }, [url, refreshKey]);

  if (!url) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-slate-400" style={{ minHeight }}>
        Enter a URL above, or pick a preview target
      </div>
    );
  }

  if (embeddable === null) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500" style={{ minHeight }}>
        <Loader2 className="h-5 w-5 animate-spin" />
        Checking if this page can be embedded…
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center" style={{ minHeight }}>
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-semibold text-slate-800">Live preview cannot embed this URL</p>
        <p className="max-w-md text-xs text-slate-500">
          Production pages block iframes for security ({reason ?? 'X-Frame-Options / CSP'}). Use <strong>Open in new tab</strong> instead.
        </p>
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-700">
          <ExternalLink className="h-4 w-4" />
          Open {url.replace(/^https?:\/\//, '').slice(0, 48)}{url.length > 56 ? '…' : ''}
        </a>
      </div>
    );
  }

  const constrainedWidth = device === 'mobile' ? 375 : device === 'tablet' ? 768 : null;
  const iframeKey = `${url}-${refreshKey}-${device}`;

  const iframe = (
    <iframe
      key={iframeKey}
      title="Live site preview"
      src={url}
      className="h-full w-full border-0"
      style={{ minHeight: minHeight - 16 }}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      onLoad={() => setLoading(false)}
    />
  );

  return (
    <div className="relative h-full w-full" style={{ minHeight }}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
          <Loader2 className="h-5 w-5 animate-spin text-brand-blue-600" />
        </div>
      )}
      {constrainedWidth ? (
        <div className="flex h-full justify-center overflow-auto bg-slate-100 p-2">
          <div className="h-full bg-white shadow-lg ring-1 ring-slate-200" style={{ width: constrainedWidth }}>
            {iframe}
          </div>
        </div>
      ) : iframe}
    </div>
  );
}
