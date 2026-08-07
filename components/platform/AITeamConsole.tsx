'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Mic, Send, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { COMMERCIAL_AI_AGENTS, type CommercialAgentId } from '@/lib/platform/commercial-ai-agents';

type Message = { role: 'user' | 'assistant'; content: string };

type Props = {
  initialAgent?: CommercialAgentId;
  title?: string;
};

export default function AITeamConsole({ initialAgent = 'paris', title = 'Your AI Business Team' }: Props) {
  const [agentId, setAgentId] = useState<CommercialAgentId>(initialAgent);
  const [messages, setMessages] = useState<Record<CommercialAgentId, Message[]>>({ paris: [], ellie: [], lizzy: [], zora: [] });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [upgradeUrl, setUpgradeUrl] = useState('');
  const [speak, setSpeak] = useState(true);
  const recognitionRef = useRef<any>(null);

  const agent = COMMERCIAL_AI_AGENTS[agentId];
  const currentMessages = messages[agentId];
  const canVoice = useMemo(() => typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition), []);

  const speakText = (text: string) => {
    if (!speak || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 2500));
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const send = async (override?: string) => {
    const message = (override ?? input).trim();
    if (!message || busy) return;
    const history = [...currentMessages, { role: 'user' as const, content: message }];
    setMessages((current) => ({ ...current, [agentId]: history }));
    setInput('');
    setError('');
    setUpgradeUrl('');
    setBusy(true);

    try {
      const response = await fetch('/api/platform/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, message, history: currentMessages }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUpgradeUrl(data.upgradeUrl || 'https://www.elevateforhumanity.org/store');
        throw new Error(data.error || `${agent.name} is unavailable`);
      }
      const assistantMessage: Message = { role: 'assistant', content: data.response || 'No response returned.' };
      setMessages((current) => ({ ...current, [agentId]: [...history, assistantMessage] }));
      speakText(assistantMessage.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assistant request failed');
    } finally {
      setBusy(false);
    }
  };

  const startVoice = () => {
    if (!canVoice) {
      setError('Voice input is not supported by this browser. You can type instead.');
      return;
    }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput(transcript);
    };
    recognition.onerror = () => setError('Voice input could not start. You can continue by typing.');
    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-700">AI Team</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Choose a specialist. Each assistant has a different business role and is unlocked through your subscription or add-ons.</p>
          </div>
          <button type="button" onClick={() => setSpeak((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700">
            {speak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Spoken replies {speak ? 'on' : 'off'}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.values(COMMERCIAL_AI_AGENTS)).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setAgentId(item.id); setError(''); setUpgradeUrl(''); }}
              className={`rounded-2xl border p-4 text-left transition ${agentId === item.id ? 'border-brand-red-500 bg-brand-red-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center gap-2"><Bot className="h-5 w-5" /><span className="font-black">{item.name}</span></div>
              <p className="mt-2 text-xs leading-5 text-slate-600">{item.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-5 rounded-2xl bg-slate-950 p-5 text-white">
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-300" /><h2 className="font-black">{agent.name}</h2></div>
          <p className="mt-2 text-sm text-slate-300">{agent.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.starterPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => send(prompt)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20">{prompt}</button>
            ))}
          </div>
        </div>

        <div className="min-h-[260px] space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {!currentMessages.length && <p className="py-16 text-center text-sm text-slate-500">Ask {agent.name} a question or choose one of the guided prompts above.</p>}
          {currentMessages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>{message.content}</div>
            </div>
          ))}
          {busy && <div className="text-sm font-semibold text-slate-500">{agent.name} is working…</div>}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {error}
            {upgradeUrl && <Link href={upgradeUrl} className="ml-2 font-black underline">View upgrade</Link>}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={startVoice} className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-slate-300 bg-white" aria-label="Speak"><Mic className="h-5 w-5" /></button>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={`Ask ${agent.name}…`} className="min-h-12 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500" />
          <button type="button" onClick={() => send()} disabled={busy || !input.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 font-black text-white disabled:opacity-50"><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></button>
        </div>
      </div>
    </div>
  );
}
