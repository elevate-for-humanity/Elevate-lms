'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Globe, Loader2 } from 'lucide-react';

function useEmbedCheck(url: string) {
  const [state, setState] = useState<{ embeddable: boolean | null; reason?: string }>({ embeddable: null });

  useEffect((): void => {
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

export default function IframePreview({
  url,
  title = 'Live Preview',
  className = '',
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const { embeddable, reason } = useEmbedCheck(url);
  const [loading, setLoading] = useState(true);

  useEffect((): void => {
    setLoading(true);
  }, [url]);

  if (!url) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-3 bg-slate-50 ${className}`}>
        <Globe className="h-8 w-8 text-slate-300" />
        <p className="text-xs text-slate-500">Enter a URL above to preview the live site</p>
      </div>
    );
  }

  if (embeddable === null) {
    return (
      <div className={`flex h-full items-center justify-center bg-slate-50 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (embeddable === false) {
    return (
      <div className={`flex h-full flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center ${className}`}>
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm font-medium text-slate-800">This page can&apos;t be embedded here</p>
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">
          The server returned{' '}
          <code className="rounded bg-white px-1 py-0.5 text-brand-blue-700">{reason}</code>. Open it in a new tab
          instead. After LMS deploy, production allows embedding from the admin portal.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          Open in new tab
        </a>
      </div>
    );
  }

  return (
    <div className={`relative h-full min-h-0 ${className}`}>
      {loading && (
        <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-center border-b border-slate-200 bg-white/90">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
      <iframe
        title={title}
        src={url}
        className="h-full w-full border-0 bg-white"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
