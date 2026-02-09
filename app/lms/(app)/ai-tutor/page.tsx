'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, FileText, Lightbulb, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  { icon: BookOpen, text: 'Explain this concept', prompt: 'Can you explain this concept in simple terms?' },
  { icon: FileText, text: 'Create study guide', prompt: 'Create a study guide for my current topic' },
  { icon: Lightbulb, text: 'Practice questions', prompt: 'Give me some practice questions to test my understanding' },
  { icon: Sparkles, text: 'Summarize lesson', prompt: 'Summarize the key points from my current lesson' },
];



export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Tutor, here to help you succeed in your training. I can explain concepts, create study guides, generate practice questions, and help you prepare for exams. What would you like to learn about today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [mode, setMode] = useState<'chat' | 'essay' | 'study-guide'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId,
          mode,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `I apologize, but I encountered an issue: ${data.error}. Please try again or contact support if the problem persists.`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.message },
        ]);
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Ai Tutor" }]} />
      </div>
      {/* Header */}
      <div className="bg-blue-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Tutor</h1>
              <p className="text-blue-100 text-sm">Your 24/7 learning assistant</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'chat', label: 'Chat', desc: 'General Q&A' },
            { id: 'essay', label: 'Essay Help', desc: 'Writing assistance' },
            { id: 'study-guide', label: 'Study Guide', desc: 'Create materials' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as typeof mode)}
              className={`flex-1 p-3 rounded-xl border-2 transition ${
                mode === m.id
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs opacity-75">{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {QUICK_PROMPTS.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(prompt.prompt)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-purple-300 hover:text-blue-600 transition whitespace-nowrap disabled:opacity-50"
                >
                  <prompt.icon className="w-4 h-4" />
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your coursework..."
                className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="px-6 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <h3 className="font-semibold text-purple-900 mb-2">Tips for better results:</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Be specific about what you want to learn</li>
            <li>• Ask follow-up questions for deeper understanding</li>
            <li>• Request examples or practice problems</li>
            <li>• Use Study Guide mode to create exam prep materials</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
