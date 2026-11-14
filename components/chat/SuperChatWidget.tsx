'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Phone, Mail, Globe, Sparkles } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getAssistantScript, AssistantScript, QuickAction } from '@/lib/chat/scripts';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface SuperChatWidgetProps {
  assistantId?: string;
  defaultOpen?: boolean;
  theme?: 'gradient' | 'minimal' | 'bold';
}

const THEMES = {
  gradient: {
    button: 'bg-gradient-to-br from-brand-blue-600 to-indigo-700 hover:shadow-brand-blue-500/40',
    header: 'bg-gradient-to-r from-brand-blue-600 to-indigo-700',
    accent: 'bg-brand-orange-500',
  },
  minimal: {
    button: 'bg-slate-700 hover:bg-slate-800',
    header: 'bg-slate-700',
    accent: 'bg-brand-blue-500',
  },
  bold: {
    button: 'bg-black hover:bg-gray-900',
    header: 'bg-black',
    accent: 'bg-red-500',
  },
};

export default function SuperChatWidget({
  assistantId = 'elevate-main',
  defaultOpen = false,
  theme = 'gradient',
}: SuperChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<AssistantScript | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai' | 'demo'>('demo');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const themeColors = THEMES[theme];

  // Load assistant script
  useEffect(() => {
    const loadedScript = getAssistantScript(assistantId, 'prod');
    if (loadedScript) {
      setScript(loadedScript);
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: loadedScript.greeting,
        timestamp: new Date(),
      }]);
    }
  }, [assistantId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Detect AI provider
  useEffect(() => {
    // This will be determined by the API response
  }, []);

  const getFallbackResponse = (userMessage: string): string => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('program') || lower.includes('course') || lower.includes('training')) {
      return `We offer funded training in:

**Healthcare:** CNA, Phlebotomy, Medical Assistant
**Skilled Trades:** HVAC, CDL Truck Driving, Electrical
**Professional:** Barbering, Cosmetology, Esthetics

Training may be FREE with WIOA funding! Visit ${PLATFORM_DEFAULTS.canonicalDomain}/programs for details.`;
    }
    
    if (lower.includes('apply') || lower.includes('start') || lower.includes('enroll')) {
      return `Ready to start? Here's how:

1. Visit ${PLATFORM_DEFAULTS.canonicalDomain}/apply
2. Complete the eligibility check (2 min)
3. We'll contact you within 24 hours

Or call ${PLATFORM_DEFAULTS.supportPhone} for instant help!`;
    }
    
    if (lower.includes('free') || lower.includes('cost') || lower.includes('pay') || lower.includes('fund')) {
      return `Great news! Many programs are FREE through:

• **WIOA** - For low-income adults
• **Workforce Ready Grant** - Indiana residents
• **Job Ready Indy** - Justice-involved individuals

Check your eligibility at ${PLATFORM_DEFAULTS.canonicalDomain}/wioa-eligibility or call ${PLATFORM_DEFAULTS.supportPhone}!`;
    }
    
    if (lower.includes('contact') || lower.includes('call') || lower.includes('human') || lower.includes('talk')) {
      setShowContact(true);
      return `I'd love to connect you with our team!`;
    }
    
    return `Thanks for reaching out! I can help you with:

• Finding the right program
• Checking funding eligibility
• Application questions
• General information

What would you like to know more about?`;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Check for escalation triggers first
    if (script?.escalation_rules) {
      for (const rule of script.escalation_rules) {
        if (content.toLowerCase().includes(rule.trigger.toLowerCase())) {
          setMessages(prev => [...prev, {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: rule.message,
            timestamp: new Date(),
          }]);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages.slice(-10).map(m => ({ role: m.role, content: m.content })), { role: 'user', content }] }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Detect provider from response
        if (data.provider === 'anthropic') setAiProvider('anthropic');
        else if (data.provider === 'openai') setAiProvider('openai');
        
        setMessages(prev => [...prev, {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: data.reply || data.response || "I'm here to help!",
          timestamp: new Date(),
        }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Use smart fallback
      const fallback = getFallbackResponse(content);
      setMessages(prev => [...prev, {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, script]);

  const handleQuickAction = (action: QuickAction) => {
    sendMessage(action.label);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const getProviderBadge = () => {
    switch (aiProvider) {
      case 'anthropic':
        return 'PARIS AI';
      case 'openai':
        return 'OpenAI';
      default:
        return 'AI';
    }
  };

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-16 md:h-16 ${themeColors.button} text-white rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center z-50 group`}
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Sparkles className={`w-3 h-3 ${theme === 'gradient' ? 'text-brand-blue-600' : 'text-gray-700'}`} />
          </span>
        </button>
      </>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[calc(100vw-2rem)] md:w-96 max-w-md ${isMinimized ? 'h-16' : 'h-[70vh] md:h-[600px]'} bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 transition-all`}>
      {/* Header */}
      <div className={`${themeColors.header} text-white p-4 rounded-t-2xl flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">{script?.name || 'AI Assistant'}</h3>
            <p className="text-xs text-white flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online • {getProviderBadge()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Contact Modal */}
          {showContact && (
            <div className="bg-brand-blue-50 border-b border-brand-blue-100 p-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900 mb-2">Contact Our Team</p>
                  <div className="flex flex-wrap gap-2">
                    <a href={`tel:${PLATFORM_DEFAULTS.supportPhone}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm text-slate-700 hover:bg-brand-blue-100 transition">
                      <Phone className="w-4 h-4" />
                      {PLATFORM_DEFAULTS.supportPhone}
                    </a>
                    <a href={`mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm text-slate-700 hover:bg-brand-blue-100 transition">
                      <Mail className="w-4 h-4" />
                      Email Us
                    </a>
                    <a href={`https://${PLATFORM_DEFAULTS.canonicalDomain}`} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm text-slate-700 hover:bg-brand-blue-100 transition">
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  </div>
                </div>
                <button onClick={() => setShowContact(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-brand-blue-600' 
                    : 'bg-slate-200'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-slate-700" />
                  )}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-brand-blue-600 text-white rounded-br-md'
                    : 'bg-white text-slate-900 shadow-sm rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-slate-700" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && script?.quick_actions && (
            <div className="px-4 py-2 bg-white border-t border-slate-200">
              <div className="flex flex-wrap gap-2">
                {script.quick_actions.slice(0, 4).map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="text-xs bg-slate-100 hover:bg-brand-blue-100 text-slate-700 hover:text-brand-blue-700 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 text-white rounded-full p-2.5 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Powered by {aiProvider === 'anthropic' ? 'PARIS AI (Claude)' : aiProvider === 'openai' ? 'OpenAI' : 'Smart AI'} • {PLATFORM_DEFAULTS.orgName}
            </p>
          </form>
        </>
      )}
    </div>
  );
}
