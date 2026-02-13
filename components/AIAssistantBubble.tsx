'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export function AIAssistantBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpen = () => {
    setIsOpen(true);
    setShowWelcome(false);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Welcome to Elevate for Humanity! I'm your AI assistant. How can I help you today?\n\n• Learn about our training programs\n• Check WIOA eligibility\n• Start your application\n• Talk to a human"
        }
      ]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
        }),
      });

      const data = await response.json();
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please call us at support center for immediate assistance." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (content: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }
      parts.push(
        <Link 
          key={match.index} 
          href={match[2]} 
          className="text-brand-orange-600 hover:underline font-medium"
          onClick={() => setIsOpen(false)}
        >
          {match[1]}
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <>
      {showWelcome && !isOpen && (
        <div className="fixed bottom-24 right-6 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl p-4 max-w-xs border border-gray-200 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-black"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-sm text-black font-medium mb-2">
              Need help finding the right program?
            </p>
            <p className="text-xs text-gray-600 mb-3">
              I can help you explore training options and check your eligibility!
            </p>
            <button
              onClick={handleOpen}
              className="text-xs bg-brand-orange-600 text-white px-3 py-2.5 rounded-md hover:bg-brand-orange-700 transition-colors font-medium"
            >
              Chat with AI Assistant
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex bg-brand-orange-600 text-white rounded-full p-4 shadow-2xl hover:bg-brand-orange-700 transition-all hover:scale-110"
        >
          <MessageCircle className="h-10 w-10" />
          <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-96 h-[85vh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col border border-gray-200">
          <div className="bg-gradient-to-r from-brand-orange-600 to-brand-orange-500 text-white p-4 md:rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Elevate AI Assistant</h3>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-full p-2">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-brand-orange-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
                }`}>
                  <div className="text-sm whitespace-pre-line">{renderMessage(message.content)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-orange-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-white flex gap-2 overflow-x-auto">
              {['View Programs', 'Check Eligibility', 'Apply Now'].map((action) => (
                <button
                  key={action}
                  onClick={() => { setInput(action); }}
                  className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 border-t border-gray-200 bg-white md:rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-orange-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-brand-orange-600 text-white rounded-full p-2 hover:bg-brand-orange-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Call <a href="/support" className="text-brand-orange-600 hover:underline">support center</a> for immediate help
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default AIAssistantBubble;
