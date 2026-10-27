'use client';

import { FormEvent, useState } from 'react';
import { Bot, Loader2, Send, User } from 'lucide-react';
import VoiceDictationButton from '@/components/voice/VoiceDictationButton';

type Message = { role: 'user' | 'assistant'; content: string };
type CourseDraft = {
  title?: string;
  audience?: string;
  duration_hours?: number;
  description?: string;
  modules?: Array<{ title?: string; lessons?: unknown[] }>;
};

export default function CourseBuilderConversation({
  onDraft,
}: {
  onDraft: (draft: CourseDraft) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Tell me what course you want to build. I will ask for any missing details, create a draft, and place the result into the builder for your review.',
    },
  ]);
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const command = input.trim();
    if (!command || working) return;
    const requestMessages = [...messages, { role: 'user' as const, content: command }];
    setMessages(requestMessages);
    setInput('');
    setError('');
    setWorking(true);

    try {
      const response = await fetch('/api/admin/courses/ai-builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessages }),
      });
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Course Builder AI is unavailable (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reply = '';
      let draft: CourseDraft | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';
        for (const eventText of events) {
          const line = eventText.split('\n').find((line) => line.startsWith('data: '));
          if (!line) continue;
          const eventData = JSON.parse(line.slice(6));
          if (eventData.type === 'text') reply += String(eventData.content || '');
          if (eventData.type === 'course_ready') draft = eventData.course as CourseDraft;
          if (eventData.type === 'error') throw new Error(eventData.message || 'Course generation failed');
        }
      }
      const finalReply = reply.trim() || (draft ? 'I created the course draft and loaded it into the builder below.' : 'I need one more detail before I can build it.');
      setMessages((current) => [...current, { role: 'assistant', content: finalReply }]);
      if (draft) onDraft(draft);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Course Builder AI is unavailable.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-cyan-800 bg-slate-900" aria-label="Talk to Course Builder">
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Bot className="h-5 w-5 text-cyan-300" /> Talk to Course Builder</h2>
        <p className="mt-1 text-sm text-slate-300">This conversation creates a draft. Nothing publishes until you review and confirm it.</p>
      </div>
      <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : ''}`}>
            {message.role === 'assistant' ? <Bot className="mt-1 h-5 w-5 shrink-0 text-cyan-300" /> : null}
            <p className={`max-w-3xl whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-100'}`}>{message.content}</p>
            {message.role === 'user' ? <User className="mt-1 h-5 w-5 shrink-0 text-cyan-300" /> : null}
          </div>
        ))}
        {working ? <p className="flex items-center gap-2 text-sm text-cyan-200"><Loader2 className="h-4 w-4 animate-spin" /> Course Builder is working…</p> : null}
        {error ? <p role="alert" className="rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">Not completed: {error}</p> : null}
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-700 p-3">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder="Example: Build a 20-hour beginner tax preparation course for Indiana adults…" className="min-w-0 flex-1 resize-y rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-white" />
        <VoiceDictationButton label="course request" onTranscript={(transcript) => setInput((current) => `${current} ${transcript}`.trim())} />
        <button type="submit" disabled={working || !input.trim()} className="rounded-lg bg-cyan-500 p-3 text-slate-950 disabled:opacity-50" aria-label="Send to Course Builder"><Send className="h-5 w-5" /></button>
      </form>
    </section>
  );
}
