'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Send, User, Bot, GraduationCap, ArrowRight, Stethoscope, Wrench, Scissors, FileCheck } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ParisChatProps {
  onComplete?: (recommendations: string[]) => void;
  showHeader?: boolean;
  className?: string;
}

const PATHWAYS = [
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' },
  { id: 'trades', label: 'Skilled Trades', icon: Wrench, color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-white' },
  { id: 'beauty', label: 'Beauty & Cosmo', icon: Scissors, color: 'bg-pink-500 hover:bg-pink-600', textColor: 'text-white' },
  { id: 'testing', label: 'Testing & Certs', icon: FileCheck, color: 'bg-blue-500 hover:bg-blue-600', textColor: 'text-white' },
];

export default function ParisChat({ onComplete, showHeader = true, className = '' }: ParisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const greeting: Message = {
    role: 'assistant',
    content: `👋 Hi! I'm **Paris** — your career guide at Elevate for Humanity.

I can help you find the right career path. **Just click an option below** or type your interest:

🏥 **Healthcare** — Medical Assistant, Phlebotomy, CNA, Pharmacy Tech
⚙️ **Skilled Trades** — HVAC, CDL, Building Maintenance, EPA Certs
✂️ **Beauty & Cosmo** — Barber, Cosmetology, Esthetics
📝 **Testing** — ACT WorkKeys, OSHA, CPR, NHA Prep

*No pressure, no commitment — just honest guidance.*`,
  };

  useEffect(() => {
    setMessages([greeting]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToApi = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/zora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: messages.slice(-20), sessionId }),
      });

      if (!response.ok) throw new Error('Failed');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      if (data.response.includes('Next step') || data.response.includes('book a free')) {
        onComplete?.([]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I'm having trouble right now. Please try again or reach us at **info@elevateforhumanity.org** — we're happy to help!`,
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, messages, sessionId, onComplete]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendToApi(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendToApi(input);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {showHeader && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Paris</h2>
              <p className="text-sm text-white/80">Career Guidance Assistant</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white text-slate-800 rounded-tl-sm shadow-sm border border-slate-200'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Finding your options...</span>
              </div>
            </div>
          </div>
        )}

        {!isLoading && messages.length === 1 && (
          <div className="space-y-2">
            {PATHWAYS.map(({ id, label, icon: Icon, color, textColor }) => (
              <button
                key={id}
                onClick={() => sendToApi(`I'm interested in ${label}`)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${color} ${textColor} font-medium transition-all active:scale-[0.98] shadow-sm`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-4 sm:px-6 py-4 shrink-0">
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Or type your interest here..."
            className="flex-1 resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-400 transition-colors min-h-[52px] max-h-40"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Or click a pathway above — no typing required!
        </p>
      </form>
    </div>
  );
}
