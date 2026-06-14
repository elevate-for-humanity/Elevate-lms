'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Send, Sparkles, Terminal } from 'lucide-react';
import type { StudioRuntimeCompletion } from '@/lib/devstudio/studio-runtime';
import DevStudioRuntimeStatus from '@/components/dev-studio/DevStudioRuntimeStatus';

const XTerminal = dynamic(() => import('@/components/dev-studio/XTerminal'), { ssr: false });

const QUICK_ACTIONS = [
  { label: 'Website deploy', command: 'Deploy the LMS service' },
  { label: 'Admin deploy', command: 'Deploy the admin service' },
  { label: 'Runtime deploy', command: 'Deploy the Dev Studio Runtime service' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'Build course', command: 'Generate a new course' },
  { label: 'System health', command: 'Check system health' },
];

type Subview = 'terminal' | 'commands';

export default function RunWorkspace({ studioRuntime }: { studioRuntime?: StudioRuntimeCompletion }) {
  const [subview, setSubview] = useState<Subview>('terminal');
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<{ type: 'user' | 'output' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runtimeReady = studioRuntime?.phase === 'ready';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  async function run(command: string) {
    const trimmed = command.trim();
    if (!trimmed || loading) return;
    setInput('');
    setLoading(true);
    setLines([{ type: 'user', text: trimmed }]);

    try {
      const isSmoke = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(trimmed);
      const res = await fetch(
        isSmoke ? '/api/devstudio/smoke-test' : '/api/devstudio/execute',
        isSmoke
          ? undefined
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: trimmed }),
            },
      );

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer: string;
      buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          if (!chunk.startsWith('data: ')) continue;
          const raw = chunk.slice(6).trim();
          if (!raw || raw === '[DONE]') continue;
          let text = raw;
          try {
            const parsed = JSON.parse(raw);
            text = parsed.line ?? parsed.text ?? parsed.output ?? raw;
          } catch {
            text = raw;
          }
          setLines((current) => [...current, { type: 'output', text }]);
        }
      }
    } catch (error) {
      setLines((current) => [
        ...current,
        { type: 'error', text: error instanceof Error ? error.message : 'Command failed' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex shrink-0 items-center gap-1 border-b border-[#3c3c3c] bg-[#252526] px-2">
        <button
          type="button"
          onClick={() => setSubview('terminal')}
          className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-[11px] text-white"
          style={{ background: subview === 'terminal' ? '#094771' : 'transparent' }}
        >
          <Terminal className="h-3.5 w-3.5" />
          Terminal
        </button>
        <button
          type="button"
          onClick={() => setSubview('commands')}
          className="inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-[11px] text-white"
          style={{ background: subview === 'commands' ? '#094771' : 'transparent' }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI commands
        </button>
      </div>

      {!runtimeReady && (
        <div className="shrink-0 border-b border-[#3c3c3c] p-2">
          <DevStudioRuntimeStatus runtime={studioRuntime} compact />
        </div>
      )}

      {subview === 'terminal' ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <XTerminal />
        </div>
      ) : (
        <>
          <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-[#3c3c3c] bg-[#2d2d2d] px-2 py-2">
            {QUICK_ACTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => run(item.command)}
                disabled={loading}
                className="shrink-0 rounded border border-[#555] bg-[#3c3c3c] px-2.5 py-1 text-[11px] text-[#cccccc] disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
            {lines.length === 0 && (
              <p className="text-[#555]">
                Natural-language ops via admin APIs. Use Terminal for bash, git, and pnpm in the repo.
              </p>
            )}
            {lines.map((line, index) => (
              <div
                key={`${line.type}-${index}`}
                className="whitespace-pre-wrap break-words"
                style={{
                  color:
                    line.type === 'user' ? '#f97316' : line.type === 'error' ? '#f87171' : '#cccccc',
                }}
              >
                {line.type === 'user' ? `$ ${line.text}` : line.text}
              </div>
            ))}
            {loading && (
              <div className="mt-2 flex items-center gap-2 text-[#f97316]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            className="flex shrink-0 items-center gap-2 border-t border-[#3c3c3c] bg-[#252526] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              run(input);
            }}
          >
            <span className="font-mono text-sm font-bold text-[#f97316]">$</span>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded border border-[#555] bg-[#3c3c3c] px-3 font-mono text-sm text-[#cccccc] outline-none"
              placeholder="Tell Studio what to run"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded bg-[#f97316] text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
