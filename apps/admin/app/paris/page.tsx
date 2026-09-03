'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, FileText, Image, Code, CheckCircle2, Loader2,
  Send, X, Clock, AlertCircle, Volume2, VolumeX,
} from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'narration' | 'error';
  content: string;
  timestamp: string;
}

const COMMAND_CATEGORIES = [
  {
    id: 'course-orchestrator',
    label: 'Course Builder',
    color: 'from-purple-500 to-purple-600',
    commands: [
      { text: 'Build a Medical Assistant course', desc: 'Create full course with modules' },
      { text: 'Add a module to HVAC program', desc: 'Add new training module' },
      { text: 'Create assessment questions', desc: 'Build quiz or exam' },
      { text: 'Design competency rubric', desc: 'Create competency-based grading' },
    ],
  },
  {
    id: 'instructional-designer',
    label: 'Instructional Design',
    color: 'from-blue-500 to-blue-600',
    commands: [
      { text: 'Design a learning path for CDL', desc: 'Create curriculum roadmap' },
      { text: 'Add micro-credentials', desc: 'Design badge/credential system' },
      { text: 'Build simulation exercises', desc: 'Create interactive scenarios' },
      { text: 'Write learning objectives', desc: "Bloom's taxonomy aligned" },
    ],
  },
  {
    id: 'marketing-content',
    label: 'Content Studio',
    color: 'from-pink-500 to-pink-600',
    commands: [
      { text: 'Generate a program flyer', desc: 'Create printable flyer' },
      { text: 'Write homepage copy', desc: 'Hero and section content' },
      { text: 'Draft enrollment email', desc: 'Student enrollment sequence' },
      { text: 'Create employer outreach letter', desc: 'Business partnership letter' },
    ],
  },
  {
    id: 'marketing-social',
    label: 'Social Media',
    color: 'from-amber-500 to-amber-600',
    commands: [
      { text: 'Write LinkedIn posts', desc: 'Professional network content' },
      { text: 'Generate Twitter thread', desc: 'Short-form engagement content' },
      { text: 'Create Instagram captions', desc: 'Visual platform content' },
      { text: 'Build email newsletter', desc: 'Monthly student newsletter' },
    ],
  },
  {
    id: 'marketing-video',
    label: 'Video Scripts',
    color: 'from-emerald-500 to-emerald-600',
    commands: [
      { text: 'Write a program intro video', desc: '90-second enrollment video' },
      { text: 'Create testimonial video script', desc: 'Student success story' },
      { text: 'Build employer promo video', desc: 'Workforce partnership video' },
      { text: 'Write CTA video script', desc: 'Call-to-action overlay' },
    ],
  },
  {
    id: 'admissions-agent',
    label: 'Admissions',
    color: 'from-rose-500 to-rose-600',
    commands: [
      { text: 'Review pending applications', desc: 'Check application queue' },
      { text: 'Send enrollment reminders', desc: 'Batch outreach to prospects' },
      { text: 'Generate acceptance letters', desc: 'Bulk acceptance generation' },
      { text: 'Check funding eligibility', desc: 'WIOA and grant qualification' },
    ],
  },
  {
    id: 'qa-designer',
    label: 'Quality Assurance',
    color: 'from-cyan-500 to-cyan-600',
    commands: [
      { text: 'Review course content', desc: 'Quality check all modules' },
      { text: 'Audit assessment questions', desc: 'Validate quiz accuracy' },
      { text: 'Check accessibility', desc: 'WCAG compliance review' },
      { text: 'Run content gap analysis', desc: 'Find missing curriculum areas' },
    ],
  },
  {
    id: 'media-designer',
    label: 'Media Designer',
    color: 'from-violet-500 to-violet-600',
    commands: [
      { text: 'Find hero image for program', desc: 'Stock photo search' },
      { text: 'Create program badge/credential', desc: 'Graduate certificate graphic' },
      { text: 'Design funding badge set', desc: 'WIOA, Pell, grant badges' },
      { text: 'Build employer logo wall', desc: 'Partnership logos section' },
    ],
  },
];

export default function ParisOSPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch real task stats from Supabase on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/dev-studio/workflows');
        if (!res.ok) return;
        const data = await res.json();
        const tasks = Array.isArray(data) ? data : (data.tasks ?? []);
        setStats({
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === 'completed').length,
          active: tasks.filter((t: any) => t.status === 'running').length,
          failed: tasks.filter((t: any) => t.status === 'failed').length,
        });
      } catch {
        // silently ignore
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((type: ChatMessage['type'], content: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const handleCommand = useCallback(async (command: string, agentType: string) => {
    if (!command.trim()) return;
    setInputValue(command);
    setIsProcessing(true);
    setShowPanel(true);
    setError(null);

    addMessage('user', command);
    addMessage('narration', `Dispatching ${agentType} agent...`);

    const correlationId = crypto.randomUUID();
    try {
      const res = await fetch('/api/paris/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
        body: JSON.stringify({ agentType, command }),
      });
      const responseText = await res.text();
      let data: Record<string, any> = {};
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText.slice(0, 500) };
      }
      if (!res.ok || !data.success) {
        const traceId = data.traceId || data.correlationId || res.headers.get('x-correlation-id') || correlationId;
        throw new Error(`${data.message || res.statusText || 'Execution failed'} (HTTP ${res.status}, correlation ${traceId})`);
      }

      addMessage('ai', data.message);
      if (data.actions?.length) {
        addMessage('narration', 'Actions completed:');
        for (const action of data.actions) addMessage('ai', `✓ ${action}`);
      }

      // Refresh stats
      const statsRes = await fetch('/api/admin/dev-studio/workflows');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const tasks = Array.isArray(statsData) ? statsData : (statsData.tasks ?? []);
        setStats({
          total: tasks.length,
          completed: tasks.filter((t: any) => t.status === 'completed').length,
          active: tasks.filter((t: any) => t.status === 'running').length,
          failed: tasks.filter((t: any) => t.status === 'failed').length,
        });
      }
    } catch (err) {
      const msg = err instanceof Error
        ? `${err.message}${err.message.includes('correlation') ? '' : ` (correlation ${correlationId})`}`
        : `Unknown error (correlation ${correlationId})`;
      setError(msg);
      addMessage('error', `Error: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommand(inputValue, activeCategory ?? 'course-orchestrator');
    }
  }, [inputValue, activeCategory, handleCommand]);

  const executeCommand = useCallback((text: string, agentType: string) => {
    handleCommand(text, agentType);
  }, [handleCommand]);

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800 px-3 py-4 sm:px-6">
        <div className="mx-auto flex min-w-0 max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PARIS</h1>
              <p className="text-xs text-slate-400">AI Operating System</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Total Tasks', value: stats.total, color: 'text-white' },
              { label: 'Completed', value: stats.completed, color: 'text-green-400' },
              { label: 'Active', value: stats.active, color: 'text-yellow-400' },
              { label: 'Failed', value: stats.failed, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="text-center hidden md:block">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 text-slate-400 hover:text-white transition-colors">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <Link href="/" className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto min-w-0 max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI Agents — Real Execution
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">What would you like to build?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Select an AI agent category below, or type a command directly.
            Each agent executes real tasks against your Supabase database and logs results.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="mb-8 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
          {COMMAND_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`bg-slate-800 border rounded-2xl p-5 text-left transition-all hover:border-slate-600 ${
                activeCategory === cat.id ? 'border-yellow-500/50 bg-slate-700/50' : 'border-slate-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3`}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <p className="text-white font-bold text-sm">{cat.label}</p>
              <p className="text-slate-400 text-xs mt-1">{cat.commands.length} commands</p>
            </button>
          ))}
        </div>

        {activeCategory && (
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-4">
              Commands for {COMMAND_CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMMAND_CATEGORIES.find(c => c.id === activeCategory)?.commands.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => executeCommand(cmd.text, activeCategory)}
                  disabled={isProcessing}
                  className="bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 rounded-xl p-4 text-left transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-yellow-400 transition-colors">{cmd.text}</p>
                      <p className="text-slate-400 text-xs mt-1">{cmd.desc}</p>
                    </div>
                    <Loader2 className="w-4 h-4 text-slate-500 group-hover:text-yellow-400 mt-1 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command (e.g. 'Build a Medical Assistant course')..."
              className="min-w-0 w-full flex-1 rounded-xl border border-slate-600 bg-slate-700 px-4 py-3 text-sm text-white placeholder-slate-400 transition-colors focus:border-yellow-500 focus:outline-none"
              disabled={isProcessing}
            />
            <button
              onClick={() => handleCommand(inputValue, activeCategory ?? 'course-orchestrator')}
              disabled={isProcessing || !inputValue.trim()}
              className="flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-5 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isProcessing ? 'Executing...' : 'Execute'}
            </button>
          </div>
          <p className="text-slate-500 text-xs mt-2">
            Commands execute via AI agents and are logged to the database. Results are real.
          </p>
        </div>

        {showPanel && messages.length > 0 && (
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-slate-700/50 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Execution Log</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{messages.length} messages</span>
                <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto p-5 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === 'user' && (
                    <div className="flex items-start justify-end gap-3">
                      <div className="bg-blue-600/80 text-white rounded-2xl rounded-tr-none px-4 py-2.5 max-w-md">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Send className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}
                  {msg.type === 'narration' && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="bg-slate-700/80 text-slate-300 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm italic border border-slate-600">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.type === 'ai' && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 text-white rounded-2xl rounded-tl-none px-4 py-2.5 max-w-md">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  )}
                  {msg.type === 'error' && (
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-2xl rounded-tl-none px-4 py-2.5 max-w-md">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  </div>
                  <div className="bg-slate-700/80 text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5">
                    <p className="text-sm italic">Agent is processing...</p>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        <div className="mt-8 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: 'Total Executions', value: stats.total, color: 'text-white' },
            { label: 'Successful', value: stats.completed, color: 'text-green-400' },
            { label: 'In Progress', value: stats.active, color: 'text-yellow-400' },
            { label: 'Failed', value: stats.failed, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
