'use client';

import { type ElementType, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  ChevronLeft,
  ExternalLink,
  FolderOpen,
  Globe,
  Key,
  Loader2,
  MoreHorizontal,
  Rocket,
  Server,
  Sparkles,
  X,
} from 'lucide-react';

type MobileTab = 'ellie' | 'deploy' | 'health' | 'preview';
type MorePanel = 'files' | 'services' | 'environments' | 'secrets' | null;

const DeployPanel = dynamic(() => import('@/components/studio/DeployPanel'), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/studio/ServicesPanel'), { ssr: false });
const SecretsPanel = dynamic(() => import('@/components/studio/SecretsPanel'), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/studio/DevContainerPanel'), { ssr: false });
const UnifiedEllieChat = dynamic(() => import('@/components/studio/UnifiedEllieChat'), { ssr: false });
const IframePreview = dynamic(() => import('@/components/studio/IframePreview'), { ssr: false });

const NAV: { id: MobileTab; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'ellie', label: 'Ellie', Icon: Sparkles },
  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'preview', label: 'Preview', Icon: Globe },
  { id: 'health', label: 'Health', Icon: Activity },
];

interface DevStudioMobileShellProps {
  isSuperAdmin?: boolean;
  health: Record<string, unknown> | null;
  previewUrl: string;
  livePreviewUrl: string;
  onPreviewUrlChange: (url: string) => void;
  onPreviewGo: () => void;
  workflowButtons?: { key: string; label: string; description: string }[];
}

export default function DevStudioMobileShell({
  isSuperAdmin = false,
  health,
  previewUrl,
  livePreviewUrl,
  onPreviewUrlChange,
  onPreviewGo,
  workflowButtons,
}: DevStudioMobileShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<MobileTab>(() => {
    const t = searchParams.get('tab');
    if (t === 'deploy') return 'deploy';
    if (t === 'health') return 'health';
    if (t === 'preview') return 'preview';
    return 'ellie';
  });
  const [moreOpen, setMoreOpen] = useState<MorePanel>(null);
  const [moreMenu, setMoreMenu] = useState(false);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'deploy') setTab('deploy');
    else if (t === 'health') setTab('health');
    else if (t === 'preview') setTab('preview');
    else if (t === 'ellie' || !t) setTab('ellie');
  }, [searchParams]);

  const aiLabel = useMemo(() => {
    if (!health) return '…';
    const parts = [
      health.hasGroq && 'Groq',
      health.hasOpenAI && 'OpenAI',
    ].filter(Boolean);
    return parts.length ? String(parts.join(' · ')) : 'Add API keys';
  }, [health]);

  function selectTab(next: MobileTab) {
    setTab(next);
    setMoreMenu(false);
    setMoreOpen(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', next === 'ellie' ? 'ellie' : next);
    router.replace(`/admin/dashboard?${params.toString()}`, { scroll: false });
  }

  const title =
    tab === 'ellie'
      ? 'Ellie'
      : tab === 'deploy'
        ? 'Deploy'
        : tab === 'preview'
          ? 'Site preview'
          : 'System health';

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-3 safe-area-top">
        <Link
          href="/admin/dashboard"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
          aria-label="Back to dashboard"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-slate-900">{title}</h1>
          <p className="truncate text-xs text-slate-500">{tab === 'ellie' ? `AI · ${aiLabel}` : 'Elevate admin'}</p>
        </div>
        <button
          type="button"
          onClick={() => setMoreMenu((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
          aria-label="More tools"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {moreMenu && (
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">More tools</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'files' as const, label: 'Files', Icon: FolderOpen },
                { id: 'services' as const, label: 'Services', Icon: Server },
                ...(isSuperAdmin
                  ? [
                      { id: 'environments' as const, label: 'Container', Icon: Bot },
                      { id: 'secrets' as const, label: 'Secrets', Icon: Key },
                    ]
                  : []),
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMoreOpen(id);
                  setMoreMenu(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="relative min-h-0 flex-1 overflow-hidden">
        {tab === 'ellie' && (
          <div className="h-full bg-white">
            <UnifiedEllieChat
              embedded
              onOpenDeploy={() => selectTab('deploy')}
              onOpenPreview={() => selectTab('preview')}
            />
          </div>
        )}
        {tab === 'deploy' && (
          <div className="h-full overflow-y-auto p-3">
            <DeployPanel workflowButtons={workflowButtons} />
          </div>
        )}
        {tab === 'preview' && (
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 gap-2 border-b border-slate-200 bg-white p-2">
              <input
                value={previewUrl}
                onChange={(e) => onPreviewUrlChange(e.target.value)}
                className="min-h-[44px] min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-800"
                placeholder="https://www.elevateforhumanity.org"
              />
              <button
                type="button"
                onClick={onPreviewGo}
                className="shrink-0 rounded-xl bg-brand-blue-600 px-4 text-sm font-semibold text-white"
              >
                Go
              </button>
              <a
                href={livePreviewUrl || previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <div className="min-h-0 flex-1 bg-slate-100">
              <IframePreview url={livePreviewUrl || previewUrl} title="Preview" className="h-full" />
            </div>
          </div>
        )}
        {tab === 'health' && (
          <div className="h-full overflow-y-auto p-4">
            <HealthCards health={health} />
          </div>
        )}

        {moreOpen && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-3">
              <button
                type="button"
                onClick={() => setMoreOpen(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-sm font-bold capitalize text-slate-900">{moreOpen}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {moreOpen === 'files' && <FilesPlaceholder />}
              {moreOpen === 'services' && <ServicesPanel />}
              {moreOpen === 'environments' && isSuperAdmin && <DevContainerPanel />}
              {moreOpen === 'secrets' && isSuperAdmin && <SecretsPanel />}
            </div>
          </div>
        )}
      </main>

      <nav className="flex shrink-0 border-t border-slate-200 bg-white pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectTab(id)}
              className="flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1"
            >
              <Icon
                className={`h-5 w-5 ${active ? 'text-brand-blue-600' : 'text-slate-400'}`}
              />
              <span
                className={`text-[10px] font-semibold ${active ? 'text-brand-blue-600' : 'text-slate-500'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function HealthCards({ health }: { health: Record<string, unknown> | null }) {
  if (!health) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading…
      </div>
    );
  }
  const rows = [
    { label: 'Groq', ok: Boolean(health.hasGroq) },
    { label: 'OpenAI', ok: Boolean(health.hasOpenAI) },
    { label: 'Anthropic', ok: Boolean(health.hasAnthropic) },
    { label: 'Gemini', ok: Boolean(health.hasGemini) },
    { label: 'GitHub', ok: Boolean(health.hasGitHub) },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Provider keys and integrations for Dev Studio / Ellie.
      </p>
      {rows.map((r) => (
        <div
          key={r.label}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <span className="font-medium text-slate-800">{r.label}</span>
          <span
            className={`text-xs font-bold ${r.ok ? 'text-brand-green-700' : 'text-amber-600'}`}
          >
            {r.ok ? 'Connected' : 'Not set'}
          </span>
        </div>
      ))}
      <Link
        href="/admin/integrations/env-manager"
        className="block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
      >
        Open Environment Manager
      </Link>
    </div>
  );
}

function FilesPlaceholder() {
  return (
    <p className="p-4 text-sm text-slate-600">
      File browser is easier on desktop. Open Dev Studio on a larger screen, or use Ellie to
      search code and run deploy commands.
    </p>
  );
}
