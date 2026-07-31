'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare, Sparkles, Bot, PanelBottomClose, Play, Terminal, Activity } from 'lucide-react';
import { useState } from 'react';

const UnifiedEllieChat = dynamic(() => import('@/components/studio/UnifiedEllieChat'), {
  ssr: false,
});
const CommandCenterPanel = dynamic(() => import('@/components/studio/CommandCenterPanel'), {
  ssr: false,
});

export type BottomTab = 'output' | 'chat' | 'ellie' | 'command' | 'status';

const QUICK_CMDS = [
  { label: 'Deploy LMS', cmd: 'Deploy the LMS service' },
  { label: 'Deploy admin', cmd: 'Deploy the admin service' },
  { label: 'Smoke test', cmd: 'Run smoke test' },
  { label: 'lint', cmd: 'pnpm lint' },
];

function CommandPanel({
  onSend,
  output,
}: {
  onSend: (cmd: string) => void;
  output: string;
}) {
  const [input, setInput] = useState('');
  return (
    <div className="flex h-full flex-col" style={{ background: '#1e1e1e' }}>
      <div className="flex flex-wrap gap-1.5 border-b px-3 py-2" style={{ borderColor: '#3c3c3c' }}>
        {QUICK_CMDS.map(({ label, cmd }) => (
          <button
            key={label}
            type="button"
            onClick={() => onSend(cmd)}
            className="rounded border px-2 py-1 text-[11px] transition-colors"
            style={{ background: '#2d2d2d', color: '#cccccc', borderColor: '#3c3c3c' }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <span style={{ color: '#4ec9b0', fontSize: 12 }}>$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onSend(input.trim());
              setInput('');
            }
          }}
          placeholder="Run a deploy or smoke command…"
          className="flex-1 bg-transparent text-[12px] outline-none"
          style={{ color: '#cccccc', fontFamily: 'monospace' }}
        />
        <button
          type="button"
          onClick={() => {
            if (input.trim()) {
              onSend(input.trim());
              setInput('');
            }
          }}
          style={{ color: '#858585' }}
        >
          <Play className="h-3.5 w-3.5" />
        </button>
      </div>
      <pre
        className="min-h-0 flex-1 overflow-auto px-3 py-2 text-[11px] leading-relaxed"
        style={{ color: '#cccccc', fontFamily: 'monospace' }}
      >
        {output || 'Command output appears here (SSE via /api/devstudio/execute).'}
      </pre>
    </div>
  );
}

export default function BottomPane({
  activeTab,
  onTabChange,
  onClose,
  onSendToTerminal,
  openFile,
  fileContent,
  commandOutput = '',
}: {
  activeTab: BottomTab;
  onTabChange: (t: BottomTab) => void;
  onClose: () => void;
  onSendToTerminal: (cmd: string) => void;
  openFile: string | null;
  fileContent: string;
  commandOutput?: string;
}) {
  const TABS: { id: BottomTab; Icon: React.ElementType<{ className?: string }>; label: string }[] =
    [
      { id: 'output', Icon: Terminal, label: 'Output' },
      { id: 'ellie', Icon: Bot, label: 'Ellie' },
      { id: 'chat', Icon: MessageSquare, label: 'Code AI' },
      { id: 'command', Icon: Sparkles, label: 'Commands' },
      { id: 'status', Icon: Activity, label: 'Status' },
    ];

  const fileContext = openFile
    ? `File: ${openFile}\n\`\`\`\n${fileContent.slice(0, 4000)}\n\`\`\``
    : undefined;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" style={{ background: '#1e1e1e' }}>
      <div
        className="flex shrink-0 items-center border-b"
        style={{ background: '#2d2d2d', borderColor: '#3c3c3c', minHeight: 35 }}
      >
        {TABS.map(({ id, Icon, label }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className="flex items-center gap-1.5 border-r px-3 py-2 text-[11px] transition-colors"
              style={{
                background: active ? '#1e1e1e' : 'transparent',
                color: active ? '#fff' : '#858585',
                borderColor: '#3c3c3c',
                borderTop: active ? '1px solid #0078d4' : '1px solid transparent',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto mr-2 rounded p-1 opacity-50 hover:opacity-100"
          style={{ color: '#cccccc' }}
          title="Collapse panel"
        >
          <PanelBottomClose className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className="min-w-0 flex-1 overflow-hidden"
          style={{
            display: activeTab === 'output' || activeTab === 'command' ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <CommandPanel onSend={onSendToTerminal} output={commandOutput} />
        </div>

        <div
          className="min-w-0 flex-1 overflow-hidden"
          style={{ display: activeTab === 'ellie' ? 'flex' : 'none', flexDirection: 'column' }}
        >
          <UnifiedEllieChat embedded fileContext={fileContext} />
        </div>

        <div
          className="min-w-0 flex-1 overflow-hidden"
          style={{ display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}
        >
          <UnifiedEllieChat embedded fileContext={fileContext} />
        </div>

        <div
          className="min-w-0 flex-1 overflow-auto"
          style={{ display: activeTab === 'status' ? 'block' : 'none' }}
        >
          <CommandCenterPanel />
        </div>
      </div>
    </div>
  );
}
