'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Bot, Loader2 } from 'lucide-react';
import { TidioChatWidget } from './TidioChatWidget';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
}

const quickReplies = [
  'How do I apply?',
  'What programs do you offer?',
  'Is training free?',
  'Talk to a person',
];

function FallbackChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! 👋 I\'m the Elevate AI assistant. I can help you learn about our free career training programs, check eligibility, or answer questions. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));
      conversationHistory.push({ role: 'user', content: messageText });

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || data.response || "I'm having trouble right now. Please call us at (317) 314-3757 for assistance.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting. Please call us at (317) 314-3757 or visit elevateforhumanity.org/apply to get started!",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-brand-blue-600 text-white rounded-full shadow-lg hover:bg-brand-blue-700 transition-all hover:scale-110 flex items-center justify-center z-50"
        aria-label="Open chat"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden transition-all ${
        isMinimized ? 'h-16' : 'h-[400px] sm:h-[450px] md:h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="bg-brand-blue-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Elevate Support</h3>
            <p className="text-xs text-white">We typically reply instantly</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-[240px] sm:h-[290px] md:h-[340px] overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-brand-blue-600 text-white rounded-br-md'
                      : 'bg-white text-black shadow-sm rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 py-2 border-t bg-white">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-brand-blue-100 hover:text-brand-blue-700 transition"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500 text-black text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center hover:bg-brand-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * LiveChatWidget - Uses Tidio if configured, otherwise falls back to built-in widget
 * 
 * To enable Tidio:
 * 1. Set NEXT_PUBLIC_TIDIO_KEY environment variable in Netlify
 * 2. Configure the AI assistant in Tidio dashboard using lib/chatbot/config.ts
 */
export function LiveChatWidget() {
  const tidioKey = process.env.NEXT_PUBLIC_TIDIO_KEY;

  // Use Tidio if configured
  if (tidioKey) {
    return <TidioChatWidget publicKey={tidioKey} autoOpen={false} />;
  }

  // Fall back to built-in widget
  return <FallbackChatWidget />;
}

// Wrapper that hides chat on store pages (store has its own GuidedDemoChat)
import { usePathname } from 'next/navigation';

export function ConditionalLiveChatWidget() {
  const pathname = usePathname();
  
  // Don't show on store pages - they have GuidedDemoChat
  if (pathname?.startsWith('/store')) {
    return null;
  }
  
  return <LiveChatWidget />;
}
