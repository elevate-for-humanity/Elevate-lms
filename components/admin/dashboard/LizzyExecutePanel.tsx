'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';

const PLATFORM_QUICK_CMDS = [
  { label: 'Platform QA scan', command: 'Run full platform QA scan' },
  { label: 'Smoke test', command: 'Run smoke test' },
  { label: 'System health', command: 'Check system health' },
  { label: 'List workflows', command: 'List workflows' },
  { label: 'Deploy LMS', command: 'Deploy the LMS service' },
  { label: 'Deploy admin', command: 'Deploy the admin service' },
];

/**
 * Wired platform operations (SSE) — no legacy PTY shell.
 */
export function LizzyExecutePanel() {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState<{ type: 'user' | 'output' | 'error'; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  async function run(command: string) {
    const trimmed = command.trim();
    if (!trimmed || loading) return;
    setInput('');
    setLoading(true);
    setLines((current) => [...current, { type: 'user', text: trimmed }]);

    try {
      const isSmoke = /smoke.?test|health.?check|check.*platform|verify.*platform/i.test(trimmed);
      const isQa = /qa.?scan|platform.?qa|diagnose|audit.?platform/i.test(trimmed);
      const endpoint = isSmoke
        ? '/api/devstudio/smoke-test'
        : isQa
          ? '/api/devstudio/qa-scan?scope=all'
          : '/api/devstudio/execute';

      const res = await fetch(
        endpoint,
        isSmoke || isQa
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
            text = parsed.text ?? parsed.line ?? parsed.output ?? raw;
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#1e1e1e]">
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-[#3c3c3c] bg-[#2d2d2d] px-2 py-1.5">
        {PLATFORM_QUICK_CMDS.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled={loading}
            onClick={() => run(item.command)}
            className="shrink-0 rounded border border-[#555] bg-[#3c3c3c] px-2 py-0.5 text-[10px] text-[#cccccc] disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-xs">
        {lines.length === 0 && (
          <p className="text-[#555]">
            Lizzy runs real admin APIs across the full platform: LMS, enrollments, workflows, deploy, QA,
            and schema — wired through /api/devstudio/execute (no legacy shell).
          </p>
        )}
        {lines.map((line, index) => (
          <div
            key={`${line.type}-${index}`}
            className="whitespace-pre-wrap break-words"
            style={{
              color: line.type === 'user' ? '#f97316' : line.type === 'error' ? '#f87171' : '#cccccc',
            }}
          >
            {line.type === 'user' ? `› ${line.text}` : line.text}
          </div>
        ))}
        {loading && (
          <div className="mt-2 flex items-center gap-2 text-[#f97316]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-[#3c3c3c] bg-[#252526] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <span className="font-mono text-sm font-bold text-[#f97316]">›</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded border border-[#555] bg-[#3c3c3c] px-3 font-mono text-sm text-[#cccccc] outline-none"
          placeholder="Ask Lizzy to run a platform action…"
          disabled={loading}
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded bg-[#f97316] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
