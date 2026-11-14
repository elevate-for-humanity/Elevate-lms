'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';

type Message = { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date };
type Props = { pageContext?: string; userRole?: 'student' | 'instructor' | 'admin' | 'guest' };

export default function ChatAssistant({ pageContext = 'general', userRole = 'guest' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const getWelcomeMessage = useCallback(() => {
    const byContext: Record<string, string> = {
      courses: 'Hi! I can help you find courses, understand enrollment, and navigate training.',
      dashboard: 'Hi! I can help you understand your dashboard, progress, and next steps.',
      profile: 'Hi! I can help with profile settings, achievements, and learner records.',
      admin: 'Hi! I can help with administrative navigation, reporting, and platform workflows.',
      general: 'Hi! I can help you navigate Elevate and find the right resource.',
    };
    return byContext[pageContext] ?? byContext.general;
  }, [pageContext]);

  const quickActions = useCallback(() => {
    const actions: Record<string, string[]> = {
      courses: ['Show me available courses', 'How do I enroll?', 'What credentials can I earn?'],
      dashboard: ["What's my progress?", 'Show my next steps', 'How do I access my courses?'],
      admin: ['Where are applications?', 'Show system health', 'How do workflows run?'],
      general: ['How do I get started?', 'What programs do you offer?', 'Contact support'],
    };
    return actions[pageContext] ?? actions.general;
  }, [pageContext]);

  const sendMessage = useCallback(async (messageText?: string) => {
    const text = (messageText ?? input).trim();
    if (!text || loading) return;
    setMessages((current) => [...current, { id: `${Date.now()}-u`, role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId, context: { page: pageContext, userRole } }),
      });
      if (!response.ok) throw new Error('Assistant unavailable');
      const data = await response.json();
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((current) => [...current, { id: `${Date.now()}-a`, role: 'assistant', content: data.response || data.message || 'How can I help?', timestamp: new Date() }]);
    } catch {
      setMessages((current) => [...current, { id: `${Date.now()}-e`, role: 'assistant', content: 'I cannot reach the assistant service right now. Please try again shortly.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, conversationId, pageContext, userRole]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && messages.length === 0) setMessages([{ id: 'welcome', role: 'assistant', content: getWelcomeMessage(), timestamp: new Date() }]);
  }, [isOpen, messages.length, getWelcomeMessage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return <button type="button" onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-600 text-white shadow-lg" aria-label="Open chat assistant"><MessageCircle className="h-6 w-6" /></button>;

  return (
    <section className={`fixed bottom-6 right-6 z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${isMinimized ? 'h-16 w-80' : 'h-[600px] w-[min(400px,calc(100vw-32px))]'}`}>
      <header className="flex h-16 items-center justify-between bg-brand-blue-700 px-4 text-white"><div><h2 className="font-bold">AI Assistant</h2><p className="text-xs text-blue-100">Elevate help</p></div><div className="flex gap-2"><button type="button" onClick={() => setIsMinimized((value) => !value)} aria-label={isMinimized ? 'Maximize' : 'Minimize'}>{isMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}</button><button type="button" onClick={() => setIsOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div></header>
      {!isMinimized ? <div className="flex h-[536px] flex-col"><div className="flex-1 overflow-y-auto bg-slate-50 p-4">{messages.map((message) => <div key={message.id} className={`mb-3 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-xl px-4 py-3 text-sm ${message.role === 'user' ? 'bg-brand-blue-600 text-white' : 'bg-white text-slate-900 shadow-sm'}`}>{message.content}</div></div>)}{loading ? <p className="text-sm text-slate-500">Thinking…</p> : null}<div ref={endRef} /></div>{messages.length <= 1 ? <div className="flex flex-wrap gap-2 border-t p-3">{quickActions().map((action) => <button key={action} type="button" onClick={() => void sendMessage(action)} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">{action}</button>)}</div> : null}<div className="flex gap-2 border-t p-3"><input value={input} onChange={(event) => setInput(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} disabled={loading} placeholder="Type your message…" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button type="button" onClick={() => void sendMessage()} disabled={loading || !input.trim()} className="rounded-lg bg-brand-blue-600 p-2 text-white disabled:opacity-50" aria-label="Send"><Send className="h-5 w-5" /></button></div></div> : null}
    </section>
  );
}
