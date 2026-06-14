'use client';

/**
 * AIPanel — Persistent AI assistant for the Course Studio.
 *
 * This is NOT a generic chatbot.
 * It is course-aware: every message is prefixed with the current course
 * context from CourseProvider (title, modules, lessons, standards, active panel).
 *
 * Capabilities:
 *   - Answer questions about the course structure
 *   - Generate lesson content, quiz questions, learning objectives
 *   - Suggest improvements based on current curriculum
 *   - Execute tool actions: create lesson, generate quiz, update title
 *
 * AI memory is shared with CourseProvider — actions taken in other panels
 * appear in the AI's context automatically.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Trash2, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { useCourse } from '../CourseProvider';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// ─── Suggested prompts per panel ─────────────────────────────────────────────

const PANEL_PROMPTS: Record<string, string[]> = {
  blueprint: [
    'Suggest a module structure for this course',
    'What learning objectives should this course have?',
    'Review my course description and improve it',
  ],
  curriculum: [
    'Generate content for the next lesson',
    'What topics am I missing in this curriculum?',
    'Suggest a lesson sequence for module 1',
  ],
  quiz: [
    'Generate 5 quiz questions for the last lesson',
    'What question types work best for this content?',
    'Review my passing score thresholds',
  ],
  media: [
    'What video topics should I cover?',
    'Suggest a video script outline for lesson 1',
    'How should I structure my video content?',
  ],
  publish: [
    'Is this course ready to publish?',
    'What am I missing before publishing?',
    'Review my course for compliance gaps',
  ],
  automation: [
    'What automation rules should I set up?',
    'Suggest a workflow for course completion',
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AIPanel() {
  const { state, appendAIMemory, clearAIMemory, buildAIContext } = useCourse();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = PANEL_PROMPTS[state.activePanel] ?? PANEL_PROMPTS.blueprint;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setShowSuggestions(false);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Append to shared AI memory
    appendAIMemory({ role: 'user', content: text.trim(), source: 'user' });

    // Build context-aware message history for the API
    const courseContext = buildAIContext();
    const recentMemory = state.aiMemory.slice(-12);

    const assistantMsgId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }]);

    try {
      const res = await fetch('/api/admin/studio/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: state.course.id,
          courseContext,
          messages: [
            ...recentMemory.map(m => ({ role: m.role === 'action' ? 'assistant' : m.role, content: m.content })),
            { role: 'user', content: text.trim() },
          ],
          activePanel: state.activePanel,
        }),
      });

      if (!res.ok) throw new Error('AI request failed');

      // Stream response — handles text deltas and tool_call events
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent: string;
      fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);

              // New format: { type: 'delta'|'tool_call', ... }
              if (parsed.type === 'delta') {
                fullContent += parsed.content ?? '';
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, content: fullContent } : m
                ));
              } else if (parsed.type === 'tool_call') {
                // AI wants to execute a tool — dispatch server-side
                const toolName: string = parsed.name;
                const toolArgs: Record<string, unknown> = parsed.args ?? {};

                // Show tool execution indicator in the message
                const indicator = `\n\n⚙️ Running: **${toolName}**...`;
                fullContent += indicator;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId ? { ...m, content: fullContent } : m
                ));

                // Execute the tool
                try {
                  const toolRes = await fetch('/api/admin/studio/tool-execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      courseId: state.course.id,
                      toolName,
                      args: toolArgs,
                    }),
                  });
                  const toolResult = await toolRes.json() as { ok: boolean; message: string; data?: Record<string, unknown> };
                  const resultText = toolResult.ok
                    ? ` ✅ ${toolResult.message}`
                    : ` ❌ ${toolResult.message}`;
                  fullContent = fullContent.replace(`⚙️ Running: **${toolName}**...`, `⚙️ **${toolName}**${resultText}`);
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: fullContent } : m
                  ));
                } catch {
                  fullContent = fullContent.replace(`⚙️ Running: **${toolName}**...`, `⚙️ **${toolName}** ❌ execution failed`);
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: fullContent } : m
                  ));
                }
              } else {
                // Legacy format: { choices: [{ delta: { content } }] }
                const delta = parsed.choices?.[0]?.delta?.content ?? '';
                if (delta) {
                  fullContent += delta;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId ? { ...m, content: fullContent } : m
                  ));
                }
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      }

      // Finalize
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId ? { ...m, isStreaming: false } : m
      ));
      appendAIMemory({ role: 'assistant', content: fullContent, source: 'user' });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'AI request failed';
      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? { ...m, content: `Sorry, I encountered an error: ${errMsg}`, isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [isLoading, state.course.id, state.activePanel, state.aiMemory, appendAIMemory, buildAIContext]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleClear = () => {
    setMessages([]);
    clearAIMemory();
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
            <Bot className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
            <p className="text-xs text-slate-500 capitalize">{state.activePanel} context</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          title="Clear conversation"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-violet-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Course-aware AI</p>
            <p className="text-xs text-slate-500 mt-1">
              I know your course structure, lessons, and standards.
            </p>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`
              max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-brand-blue-600 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }
            `}>
              {msg.content || (msg.isStreaming && (
                <span className="flex gap-1 items-center py-0.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && messages.length === 0 && (
        <div className="px-4 pb-3 space-y-1.5 shrink-0">
          <button
            onClick={() => setShowSuggestions(false)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-1"
          >
            <ChevronDown className="w-3 h-3" />
            Suggestions
          </button>
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => void sendMessage(s)}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 hover:bg-violet-50 hover:text-violet-700 text-slate-600 transition border border-slate-200 hover:border-violet-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-200 shrink-0">
        <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-200 transition px-3 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this course…"
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 resize-none outline-none max-h-32"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => void sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
