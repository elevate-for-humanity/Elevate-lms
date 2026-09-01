'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';

type Viewport = 'desktop' | 'tablet' | 'mobile';

type PreviewTarget = {
  origin: string;
  url: string | null;
  label: string;
  dynamic: boolean;
};

const VIEWPORT_WIDTH: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

function cleanRouteSegments(path: string) {
  return path
    .split('/')
    .filter(Boolean)
    .filter((segment) => !/^\(.*\)$/.test(segment))
    .filter((segment) => !segment.startsWith('@'));
}

function inferTarget(filePath: string): PreviewTarget | null {
  const definitions = [
    { prefix: 'apps/marketing/app/', origin: 'https://www.elevateforhumanity.org', label: 'Marketing' },
    { prefix: 'apps/admin/app/', origin: 'https://admin.elevateforhumanity.org', label: 'Admin' },
    { prefix: 'apps/lms/app/', origin: 'https://app.elevateforhumanity.org', label: 'LMS' },
  ];

  for (const definition of definitions) {
    if (!filePath.startsWith(definition.prefix)) continue;
    const relative = filePath.slice(definition.prefix.length);
    const segments = cleanRouteSegments(relative);
    const filename = segments.at(-1) ?? '';
    if (!/^page\.(t|j)sx?$/.test(filename)) return null;

    segments.pop();
    if (segments[0] === 'api') return null;

    const dynamic = segments.some((segment) => segment.includes('['));
    const pathname = segments.length ? `/${segments.join('/')}` : '/';
    return {
      origin: definition.origin,
      url: dynamic ? null : `${definition.origin}${pathname === '/' ? '' : pathname}`,
      label: definition.label,
      dynamic,
    };
  }

  return null;
}

function htmlPreview(filePath: string, content: string, baseOrigin: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.svg')) {
    return `<!doctype html><html><head><base href="${baseOrigin}/"><style>html,body{margin:0;min-height:100%;background:white}body{display:grid;place-items:center;padding:16px;box-sizing:border-box}svg{max-width:100%;height:auto}</style></head><body>${content}</body></html>`;
  }

  if (!lower.endsWith('.html') && !lower.endsWith('.htm')) return null;
  if (/<html[\s>]/i.test(content)) {
    if (/<head[\s>]/i.test(content)) {
      return content.replace(/<head([^>]*)>/i, `<head$1><base href="${baseOrigin}/">`);
    }
    return content.replace(/<html([^>]*)>/i, `<html$1><head><base href="${baseOrigin}/"></head>`);
  }
  return `<!doctype html><html><head><base href="${baseOrigin}/"></head><body>${content}</body></html>`;
}

export default function RepositoryLivePreview({
  filePath,
  content,
  initialUrl = '',
}: {
  filePath: string | null;
  content: string;
  initialUrl?: string;
}) {
  const target = useMemo(() => inferTarget(filePath ?? ''), [filePath]);
  const defaultOrigin = target?.origin ?? 'https://www.elevateforhumanity.org';
  const sourcePreview = useMemo(
    () => (filePath ? htmlPreview(filePath, content, defaultOrigin) : null),
    [filePath, content, defaultOrigin],
  );
  const [manualUrl, setManualUrl] = useState('');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setManualUrl(target?.url ?? target?.origin ?? initialUrl);
  }, [target?.url, target?.origin, initialUrl]);

  const previewUrl = manualUrl.trim();
  const canOpen = /^https?:\/\//i.test(previewUrl);
  const modeLabel = sourcePreview
    ? 'Unsaved source preview'
    : target
      ? `${target.label} deployed route preview`
      : 'Manual URL preview';

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100">
      <header className="shrink-0 border-b border-slate-800 bg-slate-900 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto min-w-0">
            <p className="text-xs font-bold text-white">Live Preview</p>
            <p className="truncate text-[11px] text-slate-400">{modeLabel}</p>
          </div>
          {(['desktop', 'tablet', 'mobile'] as Viewport[]).map((size) => {
            const Icon = size === 'desktop' ? Monitor : size === 'tablet' ? Tablet : Smartphone;
            return (
              <button
                key={size}
                type="button"
                onClick={() => setViewport(size)}
                className={`rounded-md p-1.5 ${viewport === size ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                title={`${size} preview`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {canOpen ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Open preview in a new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        {!sourcePreview ? (
          <div className="mt-2">
            <input
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-[11px] text-slate-200 outline-none focus:border-cyan-500"
              placeholder="https://www.elevateforhumanity.org/..."
            />
            {target?.dynamic ? (
              <p className="mt-1 text-[10px] text-amber-300">
                Dynamic route detected. Enter a real record URL above to preview that page.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 rounded-lg border border-emerald-900 bg-emerald-950/40 px-2 py-1.5 text-[10px] text-emerald-200">
            HTML/SVG changes render directly from the unsaved editor buffer. They do not need a commit or deployment.
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-slate-800 p-3">
        <div
          className="mx-auto h-full min-h-[480px] overflow-hidden rounded-lg bg-white shadow-2xl transition-[width]"
          style={{ width: VIEWPORT_WIDTH[viewport], maxWidth: '100%' }}
        >
          {sourcePreview ? (
            <iframe
              key={`source-${refreshKey}`}
              title="Unsaved source preview"
              srcDoc={sourcePreview}
              sandbox="allow-forms allow-modals allow-scripts"
              referrerPolicy="no-referrer"
              className="h-full min-h-[480px] w-full border-0 bg-white"
            />
          ) : canOpen ? (
            <iframe
              key={`${previewUrl}-${refreshKey}`}
              title="Deployed route preview"
              src={previewUrl}
              sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full min-h-[480px] w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-full min-h-[480px] items-center justify-center p-8 text-center text-sm text-slate-500">
              Select an HTML/SVG file for immediate source preview, select a Next page to infer its deployed route, or enter a URL above.
            </div>
          )}
        </div>
      </div>

      {!sourcePreview && target ? (
        <footer className="shrink-0 border-t border-slate-800 bg-slate-900 px-3 py-2 text-[10px] text-slate-400">
          React/Next preview is the deployed route. Unsaved TSX cannot be executed safely without mounting the full dependency graph; use Runtime + Terminal to execute code before committing.
        </footer>
      ) : null}
    </section>
  );
}
