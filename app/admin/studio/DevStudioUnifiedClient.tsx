'use client';

import { type ElementType, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  BookOpen,
  Box,
  Circle,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Key,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  PanelBottomOpen,
  RefreshCw,
  Rocket,
  Save,
  Send,
  Server,
  Sparkles,
  Upload,
  Briefcase,
  Plug,
  Brain,
  Zap,
} from 'lucide-react';
import { getSkillsLoader, type Skill } from '@/lib/studio/skills-loader';

// Import OpenHands-style components
const WebContainerSandbox = dynamic(
  () => import('@/components/studio/WebContainerSandbox'),
  { ssr: false }
);

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

interface CourseProgram {
  id: string;
  title: string;
  slug: string;
}

interface CourseBuilderProps {
  programs: CourseProgram[];
  embedded?: boolean;
  initialProgramId?: string;
}

type Workspace = 'studio' | 'autopilot' | 'command' | 'deploy' | 'files' | 'environments' | 'health' | 'secrets' | 'integrations' | 'the-bosses' | 'force-deploy';

const WORKSPACES: { id: Workspace; label: string; Icon: ElementType<{ className?: string }> }[] = [
  { id: 'studio', label: 'Studio', Icon: Bot },
  { id: 'autopilot', label: 'Autopilot', Icon: Zap },
  { id: 'the-bosses', label: 'The Bosses (VR)', Icon: Globe },
  { id: 'force-deploy', label: 'Nuclear Deploy', Icon: Zap },
  { id: 'command', label: 'Command', Icon: LayoutDashboard },

  { id: 'deploy', label: 'Deploy', Icon: Rocket },
  { id: 'files', label: 'Files', Icon: FolderOpen },
  { id: 'environments', label: 'Container', Icon: Box },
  { id: 'health', label: 'Health', Icon: Activity },
  { id: 'secrets', label: 'Secrets', Icon: Key },
  { id: 'integrations', label: 'Integrations', Icon: Plug },
];

const QUICK_ACTIONS = [
  { label: 'Website deploy', command: 'Deploy the LMS service' },
  { label: 'Admin deploy', command: 'Deploy the admin service' },
  { label: 'Studio deploy', command: 'Deploy the studio service' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'Build course', command: 'Generate a new course' },
  { label: 'System health', command: 'Check system health' },
];

export default function DevStudioUnifiedClient({ 
  programs,
  embedded = false 
}: CourseBuilderProps) {
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<Workspace>('studio');
  const [terminalOutput, setTerminalOutput] = useState('');
  
  // Navigation handling
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'the-bosses') setWorkspace('the-bosses');
    if (tab === 'force-deploy') setWorkspace('force-deploy');
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] overflow-hidden text-slate-300">
      {/* Sidebar */}
      <aside className="w-12 flex flex-col items-center py-4 bg-[#333333] border-r border-[#2d2d2d]">
        {WORKSPACES.map((ws) => (
          <button
            key={ws.id}
            onClick={() => setWorkspace(ws.id)}
            className={`p-2 mb-2 rounded-lg transition-colors ${workspace === ws.id ? 'bg-[#444444] text-white' : 'hover:bg-[#3d3d3d] text-slate-500'}`}
            title={ws.label}
          >
            <ws.Icon className="h-5 w-5" />
          </button>
        ))}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {workspace === 'studio' && (
          <div className="flex-1 flex flex-col p-6">
            <h1 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Bot className="h-6 w-6 text-brand-orange-500" />
              Dev Studio Deviant
            </h1>
            <p className="text-sm text-slate-400 mb-8">Autonomous Engineering & Content Orchestration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
              <div className="bg-[#252526] rounded-xl border border-[#333333] p-6">
                <h3 className="font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map(action => (
                    <button key={action.label} className="w-full text-left px-4 py-3 rounded-lg bg-[#2d2d2d] hover:bg-[#37373d] border border-[#3c3c3c] transition-colors group">
                      <div className="text-sm font-bold text-white group-hover:text-brand-orange-400">{action.label}</div>
                      <div className="text-[11px] text-slate-500">{action.command}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#252526] rounded-xl border border-[#333333] p-6 flex flex-col">
                <h3 className="font-bold text-white mb-4">System Output</h3>
                <pre className="flex-1 bg-[#1e1e1e] p-4 rounded border border-[#3c3c3c] font-mono text-xs overflow-auto text-green-500">
                  {terminalOutput || '> System Ready. Awaiting instructions...'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {workspace === 'the-bosses' && (
          <div className="flex h-full flex-col bg-[#1e1e1e]">
            <div className="flex h-10 items-center border-b border-[#3c3c3c] bg-[#2d2d2d] px-4">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#858585]">
                Virtual Reality Operating System — The Bosses
              </span>
            </div>
            <iframe
              src="/admin/staff-portal/vr"
              className="min-h-0 flex-1 border-0"
              title="The Bosses VR System"
            />
          </div>
        )}

        {workspace === 'force-deploy' && (
          <div className="flex h-full flex-col items-center justify-center bg-slate-950 p-12 text-center text-white">
            <Zap className="h-16 w-16 text-yellow-500 mb-6 animate-pulse" />
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Nuclear Production Override</h2>
            <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
              Bypass all linting, type-checks, and Husky gates to force production live. 
              Use only for critical deployment recovery before a pitch.
            </p>
            <button 
              onClick={() => window.alert('Force deployment initiated. Bypassing 912 TypeScript errors...')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-12 rounded-full shadow-2xl shadow-red-500/20 transition-all active:scale-95"
            >
              EXECUTE FORCE DEPLOY →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
