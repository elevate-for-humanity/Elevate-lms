'use client';

import { type ElementType, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  Bot,
  Clapperboard,
  FolderOpen,
  Inbox,
  Key,
  Rocket,
  Server,
  Upload,
  Zap,
} from 'lucide-react';
import type { RecentApplication } from './types';

interface WorkflowButton {
  key: string;
  label: string;
  description: string;
}

interface StudioConfig {
  workflowButtons?: WorkflowButton[];
  defaultPreviewUrl?: string;
  previewTargets?: { label: string; url: string }[];
}

/** One container: AI command chat + Northflank deploy + upload/files/ops/health/errors/video */
type ToolPanel =
  | 'command'
  | 'files'
  | 'upload'
  | 'ops'
  | 'health'
  | 'errors'
  | 'video'
  | 'secrets';

const UnifiedEllieChat = dynamic(() => import('@/components/dev-studio/UnifiedEllieChat'), {
  ssr: false,
});
const DeployPanel = dynamic(() => import('@/components/dev-studio/DeployPanel'), { ssr: false });
const DevContainerPanel = dynamic(() => import('@/components/dev-studio/DevContainerPanel'), { ssr: false });
const ServicesPanel = dynamic(() => import('@/components/dev-studio/ServicesPanel'), { ssr: false });
const SecretsPanel = dynamic(() => import('@/components/dev-studio/SecretsPanel'), { ssr: false });
const LizzyFilesPanel = dynamic(() => import('./LizzyFilesPanel').then((m) => m.LizzyFilesPanel), { ssr: false });
const LizzyUploadPanel = dynamic(() => import('./LizzyUploadPanel').then((m) => m.LizzyUploadPanel), { ssr: false });
const LizzyErrorsPanel = dynamic(() => import('./LizzyErrorsPanel').then((m) => m.LizzyErrorsPanel), { ssr: false });
const LizzyVideoPanel = dynamic(() => import('./LizzyVideoPanel').then((m) => m.LizzyVideoPanel), { ssr: false });
const LizzyOperationsPanel = dynamic(
  () => import('./LizzyOperationsPanel').then((m) => m.LizzyOperationsPanel),
  { ssr: false },
);
const WorkflowsOpsPanel = dynamic(
  () => import('./WorkflowsOpsPanel').then((m) => m.WorkflowsOpsPanel),
  { ssr: false },
);

const TOOLS: { id: ToolPanel; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'command', label: 'Command', Icon: Bot },
  { id: 'upload', label: 'Upload', Icon: Upload },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'ops', label: 'Operations', Icon: Inbox },
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
    fetch('/api/admin/devstudio/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StudioConfig | null) => setConfig(data))
      .catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    fetch('/api/devstudio/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  const visibleTools = TOOLS.filter((t) => t.id !== 'secrets' || isSuperAdmin);

  function openPanel(next: ToolPanel) {
    if (next === 'secrets' && !isSuperAdmin) {
      setPanel('health');
      return;
    }
    setPanel(next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      <div className="shrink-0 border-b border-[#3c3c3c] bg-[#1a2e1a] px-3 py-2 text-[10px] leading-snug text-[#9ca3af]">
        <strong className="text-[#4ec9b0]">Ellie</strong>
        {' '}
        — unified ops, deploy, and code assistant. Deploy to Northflank, upload files, and run operations from one workspace.
      </div>

      {/* Northflank deploy — always visible */}
      <div className="shrink-0 max-h-[220px] overflow-hidden border-b border-[#3c3c3c]">
        <DeployPanel workflowButtons={config?.workflowButtons} />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[#3c3c3c] bg-[#252526] px-2 py-1.5">
        {visibleTools.map(({ id, label, Icon }) => {
          const active = panel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => openPanel(id)}
              className="inline-flex h-8 items-center gap-1.5 rounded border px-2.5 text-[11px] font-medium"
              style={{
                borderColor: active ? '#0078d4' : '#3c3c3c',
                background: active ? '#094771' : 'transparent',
                color: active ? '#ffffff' : '#cccccc',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
        <span className="ml-auto hidden items-center gap-2 text-[10px] text-[#858585] sm:flex">
          <Rocket className="h-3 w-3" />
          GitHub → Northflank
          <Server className="h-3 w-3" />
          {health ? 'Health loaded' : 'Health…'}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {panel === 'command' && <UnifiedEllieChat embedded />}
        {panel === 'upload' && <LizzyUploadPanel />}
        {panel === 'files' && <LizzyFilesPanel />}
        {panel === 'ops' && (
          <LizzyOperationsPanel
            pendingApplications={pendingApplications}
            pendingCount={pendingApplicationsCount}
            pendingProgramHolders={pendingProgramHolders}
          />
        )}
        {panel === 'health' && (
          <div className="flex h-full flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-auto">
              <EnvironmentHealthPanel />
            </div>
            <div className="h-1/2 min-h-[200px] border-t border-[#3c3c3c]">
              <ServicesPanel />
            </div>
          </div>
        )}
        {panel === 'errors' && <LizzyErrorsPanel />}
        {panel === 'video' && <LizzyVideoPanel />}
        {panel === 'secrets' && (isSuperAdmin ? <SecretsPanel /> : <LizzyErrorsPanel />)}
        {panel === 'workflows' && <WorkflowsOpsPanel />}
      </div>
    </div>
  );
}

function EnvironmentHealthPanel() {
  return (
    <div className="h-full overflow-hidden bg-white">
      <DevContainerPanel />
    </div>
  );
}
