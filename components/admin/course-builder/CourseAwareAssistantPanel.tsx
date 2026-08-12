'use client';

import { useMemo, useState } from 'react';
import { Bot, Loader2, Play, Send, Sparkles, Wrench } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ToolCall = { name: string; args?: Record<string, unknown>; id?: string; description?: string };

function normalizeToolCalls(value: unknown): ToolCall[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any) => ({
      name: String(item?.name ?? item?.tool ?? item?.function?.name ?? ''),
      args: (item?.args ?? item?.arguments ?? item?.function?.arguments ?? {}) as Record<string, unknown>,
      id: item?.id ? String(item.id) : undefined,
      description: item?.description ? String(item.description) : undefined,
    }))
    .filter((item) => Boolean(item.name));
}

export default function CourseAwareAssistantPanel({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `I am scoped to “${courseTitle}”. Ask me to inspect curriculum, identify gaps, suggest enhancements, or prepare supported Course Studio actions. I will show tool actions before executing them.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [busyTool, setBusyTool] = useState('');
  const [notice, setNotice] = useState('');

  const history = useMemo(() => messages.slice(-20), [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const nextHistory = [...history, { role: 'user' as const, content: text }];
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setToolCalls([]);
    setNotice('');

    try {
      const response = await fetch('/api/admin/studio/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, course_id: courseId, message: text, history: nextHistory, messages: nextHistory }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || body.message || 'Course AI assistant failed');

      const reply = String(body.reply ?? body.response ?? body.message ?? body.content ?? 'I completed the course analysis.');
      const calls = normalizeToolCalls(body.toolCalls ?? body.tool_calls ?? body.actions ?? body.tools);
      setMessages((current) => [...current, { role: 'assistant', content: reply }]);
      setToolCalls(calls);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Course AI assistant failed');
    } finally {
      setLoading(false);
    }
  }

  async function executeTool(call: ToolCall) {
    if (!call.name || busyTool) return;
    setBusyTool(call.id || call.name);
    setNotice('');
    try {
      const response = await fetch('/api/admin/studio/tool-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          course_id: courseId,
          tool: call.name,
          toolName: call.name,
          name: call.name,
          args: call.args ?? {},
          arguments: call.args ?? {},
          toolCallId: call.id,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || body.message || `Tool ${call.name} failed`);
      const resultText = String(body.message ?? body.result?.message ?? body.result ?? `${call.name} completed.`);
      setMessages((current) => [...current, { role: 'assistant', content: `Tool result — ${call.name}: ${resultText}` }]);
      setToolCalls((current) => current.filter((item) => (item.id || item.name) !== (call.id || call.name)));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : `Tool ${call.name} failed`);
    } finally {
      setBusyTool('');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
          <Bot className="h-4 w-4" /> Course-aware AI
        </div>
        <h2 className="mt-1 text-xl font-bold text-white">Assistant + governed tools</h2>
        <p className="mt-1 text-sm text-slate-400">
          Preserves the Course Studio AI assistant. Analysis is scoped to the selected course; tool
          calls are surfaced for explicit operator execution instead of being silently applied.
        </p>
      </div>

      <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-200'}`}>
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing {courseTitle}…
          </div>
        )}
      </div>

      {toolCalls.length > 0 && (
        <div className="mt-4 space-y-2 rounded-xl border border-amber-900 bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
            <Wrench className="h-4 w-4" /> Proposed tool actions
          </div>
          {toolCalls.map((call) => (
            <div key={call.id || call.name} className="flex flex-col justify-between gap-3 rounded-lg border border-amber-900/60 bg-slate-950 p-3 md:flex-row md:items-center">
              <div className="min-w-0">
                <div className="font-mono text-xs font-semibold text-amber-200">{call.name}</div>
                {call.description && <p className="mt-1 text-xs text-slate-400">{call.description}</p>}
                {call.args && Object.keys(call.args).length > 0 && (
                  <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap text-[11px] text-slate-500">{JSON.stringify(call.args, null, 2)}</pre>
                )}
              </div>
              <button
                onClick={() => void executeTool(call)}
                disabled={Boolean(busyTool)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
              >
                {busyTool === (call.id || call.name) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Execute
              </button>
            </div>
          ))}
        </div>
      )}

      {notice && <div className="mt-3 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-200">{notice}</div>}

      <div className="mt-4 flex gap-2">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Audit this course, compare it to its standard, suggest improvements, or prepare a supported action…"
          className="min-w-0 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <button
          onClick={() => void send()}
          disabled={loading || !input.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
        >
          {loading ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </div>
    </section>
  );
}
