'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Clock, MessageSquare } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickReplies = [
  'How do I apply for a program?',
  'What funding options are available?',
  'How do I check my application status?',
  'I need help with my account',
  'How do I contact support?',
];

async function getAIResponse(history: Message[], userMessage: string): Promise<string> {
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        context: 'support',
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    return (
      data.message ||
      data.reply ||
      data.choices?.[0]?.message?.content ||
      'Thank you for your message. For immediate assistance, call ${PLATFORM_DEFAULTS.supportPhone} Mon–Fri 9am–5pm ET or submit a support ticket at /support.'
    );
  } catch {
    return 'Thank you for your message. For immediate assistance, please call ${PLATFORM_DEFAULTS.supportPhone} (Mon–Fri 9am–5pm ET) or submit a support ticket at /support.';
  }
}

export default function LiveChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I am the Elevate support assistant. How can I help you today? You can ask about programs, funding, applications, or account issues.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const currentHistory = messages;
    const reply = await getAIResponse(currentHistory, messageText);
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Support', href: '/support' }, { label: 'Chat' }]} />
      </div>
      {/* Header */}
      <div className="bg-brand-blue-700 text-white py-4 px-4 shadow-md">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/support" className="p-2 hover:bg-brand-blue-700 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold">Live Chat Support</h1>
              <p className="text-xs text-white flex items-center gap-1">
                <span className="w-2 h-2 bg-brand-green-400 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' ? 'bg-brand-blue-600' : 'bg-slate-200'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div
                className={`max-w-4/5 rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-brand-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 rounded-tl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-slate-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></span>
                  <span
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-slate-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1.5 hover:bg-white transition"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="bg-brand-blue-600 text-white p-3 rounded-full hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Live agents available Mon-Fri 9am-5pm EST
        </p>
      </div>
    </div>
  );
}
