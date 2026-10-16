'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ExternalLink, Globe, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react';
import { SiteHealthStrip } from './SiteHealthStrip';
import { LivePreviewIframe, type PreviewDevice } from './LivePreviewIframe';

export interface PreviewTarget {
  label: string;
  url: string;
}

const CHIP_THEMES = [
  'bg-brand-blue-100 text-brand-blue-800 ring-brand-blue-200 hover:bg-brand-blue-200',
  'bg-brand-red-100 text-brand-red-800 ring-brand-red-200 hover:bg-brand-red-200',
  'bg-brand-orange-100 text-brand-orange-900 ring-brand-orange-200 hover:bg-brand-orange-200',
  'bg-brand-green-100 text-brand-green-800 ring-brand-green-200 hover:bg-brand-green-200',
  'bg-violet-100 text-violet-800 ring-violet-200 hover:bg-violet-200',
  'bg-cyan-100 text-cyan-900 ring-cyan-200 hover:bg-cyan-200',
] as const;

function themeForIndex(i: number) {
  return CHIP_THEMES[i % CHIP_THEMES.length];
}

interface Props {
  targets: PreviewTarget[];
  defaultUrl?: string;
  className?: string;
  minHeight?: number;
  showChips?: boolean;
  showSiteHealth?: boolean;
  workspaceTop?: ReactNode;
  workspaceMinHeight?: number;
}

export function ColoredLivePreviewFrame({
  targets,
  defaultUrl,
  className = '',
  minHeight = 320,
  showChips = true,
  showSiteHealth = false,
  workspaceTop,
  workspaceMinHeight = 360,
}: Props) {
  const list = useMemo(() => (targets.length > 0 ? targets : []), [targets]);
  const initial = defaultUrl ?? list[0]?.url ?? '';
  const [url, setUrl] = useState(initial);
  const [liveUrl, setLiveUrl] = useState(initial);
  const [activeChip, setActiveChip] = useState(0);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const next = defaultUrl ?? list[0]?.url ?? '';
    if (next) {
      setUrl(next);
      setLiveUrl(next);
      const idx = list.findIndex((t) => t.url === next);
      if (idx >= 0) setActiveChip(idx);
    }
  }, [defaultUrl, list]);

  const refresh = useCallback(() => {
    setLiveUrl(url);
    setRefreshKey((k) => k + 1);
  }, [url]);

  const selectTarget = (target: PreviewTarget, index: number) => {
    setActiveChip(index);
    setUrl(target.url);
    setLiveUrl(target.url);
    setRefreshKey((k) => k + 1);
  };

  if (!list.length && !url && !workspaceTop) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-brand-blue-50/40 text-sm text-slate-500 ${className}`}
        style={{ minHeight }}
      >
        No preview URL configured
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-xl ${className}`}
      style={{ minHeight: workspaceTop ? `min(95vh, ${workspaceMinHeight + minHeight + 120}px)` : undefined }}
    >
      {workspaceTop ? (
        <div
          className="flex min-h-0 shrink-0 flex-col overflow-hidden border-b border-slate-200 bg-white"
          style={{ height: `clamp(340px, 52vh, ${Math.max(workspaceMinHeight, 480)}px)` }}
        >
          {workspaceTop}
        </div>
      ) : null}

      <div className="shrink-0 border-b border-slate-700 bg-slate-900 px-3 py-3">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-sm" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-sm" aria-hidden />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm" aria-hidden />
          <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live preview
          </span>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:flex-nowrap">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            title="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <form
            className="order-first flex min-w-0 basis-full items-center gap-1.5 rounded-lg bg-white/95 px-2 shadow-sm sm:order-none sm:basis-auto sm:flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              refresh();
            }}
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-brand-blue-600" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
              spellCheck={false}
            />
          </form>
          {list.length > 3 && (
            <select
              className="hidden h-11 max-w-[12rem] shrink-0 rounded-lg bg-white px-2 text-sm text-slate-900 sm:block"
              value=""
              onChange={(e) => {
                const picked = list.find((t) => t.url === e.target.value);
                if (picked) {
                  const idx = list.indexOf(picked);
                  selectTarget(picked, idx >= 0 ? idx : 0);
                }
              }}
              title="Jump to page"
            >
              <option value="" disabled>
                Pages…
              </option>
              {list.map((t) => (
                <option key={t.url} value={t.url}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
            {(
              [
                { id: 'desktop' as const, Icon: Monitor, title: 'Desktop' },
                { id: 'tablet' as const, Icon: Tablet, title: 'Tablet' },
                { id: 'mobile' as const, Icon: Smartphone, title: 'Mobile' },
              ] as const
            ).map(({ id, Icon, title }) => (
              <button
                key={id}
                type="button"
                title={title}
                onClick={() => setDevice(id)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${device === id ? 'bg-white text-brand-blue-700' : 'text-white/90 hover:bg-white/20'}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          <a
            href={liveUrl || url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white hover:bg-slate-700"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {showSiteHealth && list.length > 0 && <SiteHealthStrip targets={list} />}

      {showChips && list.length > 0 && (
        <div className="flex max-h-24 min-w-0 shrink-0 flex-wrap gap-2 overflow-y-auto border-b border-slate-200 bg-white px-3 py-3">
          {list.map((target, i) => (
            <button
              key={`${target.url}-${i}`}
              type="button"
              onClick={() => selectTarget(target, i)}
              className={`rounded-full px-3 py-2 text-xs font-semibold ring-1 transition ${
                activeChip === i ? themeForIndex(i) : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {target.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative min-h-0 min-w-0 flex-1 bg-slate-100 p-2"
        style={{ minHeight }}
      >
        <div className="h-full overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-inner ring-1 ring-slate-100">
          <LivePreviewIframe
            url={liveUrl || url}
            device={device}
            minHeight={minHeight}
            refreshKey={refreshKey}
          />
        </div>
      </div>
    </div>
  );
}
