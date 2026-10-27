'use client';

import { type ElementType, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Bot, Clapperboard, FolderOpen, Inbox, Key, Rocket, Server, Upload, Workflow, Zap } from 'lucide-react';
import type { RecentApplication } from './types';
import { DashboardPanelErrorBoundary } from './DashboardPanelErrorBoundary';

interface WorkflowButton { key: string; label: string; description: string; }
interface StudioConfig { workflowButtons?: WorkflowButton[]; defaultPreviewUrl?: string; previewTargets?: { label: string; url: string }[]; }

type ToolPanel = 'command' | 'files' | 'upload' | 'ops' | 'health' | 'errors' | 'video' | 'secrets' | 'workflows';

const UnifiedEllieChat = dynamic(() => import('@/components/studio/UnifiedEllieChat').then((m) => m.default), { ssr: false });
const DeployPanel = dynamic(() => import('@/components/studio/DeployPanel').then((m) => m.default), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/studio/DevContainerPanel').then((m) => m.default), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/studio/ServicesPanel').then((m) => m.default), { ssr: false });
const SecretsPanel = dynamic(() => import('@/components/studio/SecretsPanel').then((m) => m.default), { ssr: false });
const LizzyFilesPanel = dynamic(() => import('./LizzyFilesPanel').then((m) => m.LizzyFilesPanel), { ssr: false });
const LizzyUploadPanel = dynamic(() => import('./LizzyUploadPanel').then((m) => m.LizzyUploadPanel), { ssr: false });
const LizzyErrorsPanel = dynamic(() => import('./LizzyErrorsPanel').then((m) => m.LizzyErrorsPanel), { ssr: false });
const LizzyVideoPanel = dynamic(() => import('./LizzyVideoPanel').then((m) => m.LizzyVideoPanel), { ssr: false });
const LizzyOperationsPanel = dynamic(() => import('./LizzyOperationsPanel').then((m) => m.LizzyOperationsPanel), { ssr: false });
const WorkflowsOpsPanel = dynamic(() => import('./WorkflowsOpsPanel').then((m) => m.WorkflowsOpsPanel), { ssr: false });

const TOOLS: { id: ToolPanel; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'command', label: 'Command', Icon: Bot },
  { id: 'upload', label: 'Upload', Icon: Upload },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'ops', label: 'Operations', Icon: Inbox },
  { id: 'workflows', label: 'Workflows', Icon: Workflow },
  { id: 'health', label: 'Health', Icon: Activity },
  { id: 'errors', label: 'Errors', Icon: Zap },
  { id: 'video', label: 'Video', Icon: Clapperboard },
  { id: 'secrets', label: 'Secrets', Icon: Key },
];

export function LizzyWorkspace({
  isSuperAdmin = false,
  onPreviewUrlDetected,
  pendingApplications = [],
  pendingApplicationsCount = 0,
  pendingProgramHolders = 0,
}: {
  isSuperAdmin?: boolean;
  onPreviewUrlDetected?: (url: string) => void;
  pendingApplications?: RecentApplication[];
  pendingApplicationsCount?: number;
  pendingProgramHolders?: number;
}) {
  const [panel, setPanel] = useState<ToolPanel>('command');
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch('/api/admin/dev-studio/config').then((response) => response.ok ? response.json() : null).then((data: StudioConfig | null) => setConfig(data)).catch(() => setConfig(null));
  }, []);
  useEffect(() => {
    fetch('/api/admin/dev-studio/health').then((response) => response.ok ? response.json() : null).then((data) => setHealth(data)).catch(() => setHealth(null));
  }, []);

  const visibleTools = TOOLS.filter((tool) => tool.id !== 'secrets' || isSuperAdmin);
  function openPanel(next: ToolPanel) {
    if (next === 'secrets' && !isSuperAdmin) return setPanel('health');
    setPanel(next);
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#111827] font-sans text-slate-100 shadow-xl">
      <div className="shrink-0 border-b border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-300"><strong className="text-cyan-300">Ellie</strong> — unified ops, deploy, code, workflows and platform health.</div>
      <div className="max-h-[180px] shrink-0 overflow-y-auto border-b border-slate-700 bg-slate-900/70 sm:max-h-[220px]"><DashboardPanelErrorBoundary name="Deploy"><DeployPanel workflowButtons={config?.workflowButtons} /></DashboardPanelErrorBoundary></div>
      <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-slate-700 bg-slate-900 px-3 py-3 [scrollbar-width:thin] sm:flex-wrap">
        {visibleTools.map(({ id, label, Icon }) => {
          const active = panel === id;
          return <button key={id} type="button" onClick={() => openPanel(id)} aria-pressed={active} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300" style={{ borderColor: active ? '#0078d4' : '#3c3c3c', background: active ? '#094771' : 'transparent', color: active ? '#fff' : '#ccc' }}><Icon className="h-4 w-4" />{label}</button>;
        })}
        <span className="ml-auto hidden items-center gap-2 text-xs text-slate-400 lg:flex"><Rocket className="h-3 w-3" />GitHub → Google Cloud Run <Server className="h-3 w-3" />{health ? 'Health loaded' : 'Health…'}</span>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <DashboardPanelErrorBoundary name={`Lizzy ${panel}`}>
          {panel === 'command' && <UnifiedEllieChat embedded onPreviewTarget={onPreviewUrlDetected} />}
          {panel === 'upload' && <LizzyUploadPanel />}
          {panel === 'files' && <LizzyFilesPanel />}
          {panel === 'ops' && <LizzyOperationsPanel pendingApplications={pendingApplications} pendingCount={pendingApplicationsCount} pendingProgramHolders={pendingProgramHolders} />}
          {panel === 'workflows' && <WorkflowsOpsPanel />}
          {panel === 'health' && <div className="flex h-full flex-col overflow-hidden"><div className="min-h-0 flex-1 overflow-auto"><EnvironmentHealthPanel /></div><div className="h-1/2 min-h-[200px] border-t border-slate-700"><ServicesPanel /></div></div>}
          {panel === 'errors' && <LizzyErrorsPanel />}
          {panel === 'video' && <LizzyVideoPanel />}
          {panel === 'secrets' && (isSuperAdmin ? <SecretsPanel /> : <LizzyErrorsPanel />)}
        </DashboardPanelErrorBoundary>
      </div>
    </div>
  );
}

function EnvironmentHealthPanel() {
  return <div className="h-full overflow-hidden bg-white"><DevContainerPanel /></div>;
}
