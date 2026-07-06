'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Send, User, Bot, GraduationCap, ArrowRight, CheckCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ParisChatProps {
  onComplete?: (recommendations: string[]) => void;
  showHeader?: boolean;
  className?: string;
}

export default function ParisChat({ onComplete, showHeader = true, className = '' }: ParisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize session and greeting
  useEffect(() => {
    initializeSession();
  }, []);

  async function initializeSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get or create session
        const response = await fetch('/api/zora/session');
        const data = await response.json();
        
        if (data.session) {
          setSessionId(data.session.id);
          
          if (data.messages && data.messages.length > 0) {
            // Resume existing session
            setMessages(data.messages.map((m: { role: string; content: string }) => ({
              role: m.role === 'user' ? 'user' : 'assistant',
              content: m.content,
            })));
          } else {
            // New session - send greeting
            await sendMessage('Start my career guidance session');
          }
        }
      } else {
        // Not authenticated - start with greeting only
        setMessages([{
          role: 'assistant',
          content: `👋 Hi there! I'm PARIS — Zero Obstacles, Ready Advisors.

I'm here to help you figure out your career path and see if Elevate's programs are right for you.

There's no pressure here — just a friendly conversation to understand your goals and how we might help you get there.

**Shall we get started?** Just tell me — what kind of work are you interested in doing?`
        }]);
      }
    } catch (error) {
      console.error('Failed to initialize session:', error);
      // Start with greeting even if session fails
      setMessages([{
        role: 'assistant',
        content: `👋 Hi there! I'm PARIS — Zero Obstacles, Ready Advisors.

I'm here to help you figure out your career path and see if Elevate's programs are right for you.

There's no pressure here — just a friendly conversation to understand your goals and how we might help you get there.

**Shall we get started?** Just tell me — what kind of work are you interested in doing?`
      }]);
    }
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/zora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-20), // Send last 20 messages for context
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if conversation is wrapping up (simple heuristic)
      if (content.toLowerCase().includes('done') || 
          content.toLowerCase().includes('finish') ||
          content.toLowerCase().includes('submit') ||
          data.response.toLowerCase().includes('next step')) {
        setIsComplete(true);
        
        // Extract recommendations from response (simple parsing)
        const recs = extractRecommendations(data.response);
        if (recs.length > 0) {
          setRecommendations(recs);
          onComplete?.(recs);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again, or you can reach us at admissions@elevateforhumanity.org for personal assistance.',
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function extractRecommendations(text: string): string[] {
    // Simple heuristic to extract program recommendations
    const programs = ['HVAC', 'CNA', 'CDL', 'barber', 'cosmetology', 'medical assistant', 
                      'phlebotomy', 'business', 'nursing', 'truck driving'];
    const found = programs.filter(p => 
      text.toLowerCase().includes(p.toLowerCase())
    );
    return found;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className={`flex flex-col h-full max-w-3xl mx-auto ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">PARIS</h2>
              <p className="text-sm text-white/80">Career Guidance Interview</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-white text-slate-800 rounded-tl-sm shadow-sm border border-slate-200'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Completion state */}
        {isComplete && recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Based on our conversation, here are some programs that might be a great fit:</span>
            </div>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2 text-green-800">
                  <ArrowRight className="w-4 h-4" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => window.location.href = '/apply'}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Apply Now
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-6 py-4 rounded-b-xl">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
