'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Bot, User, Clock, MessageSquare } from 'lucide-react';

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

const botResponses: Record<string, string> = {
  'how do i apply': 'To apply for a program, visit our Apply page at /apply. You will need to provide basic information, select your program of interest, and complete the eligibility screening. The process takes about 10-15 minutes.',
  'funding': 'We offer several funding options including WIOA (Workforce Innovation and Opportunity Act), WRG (Workforce Ready Grant), and Job Ready Indy (Job Ready Indy) funding. You can also choose self-pay options. Visit /funding to learn more about eligibility.',
  'application status': 'To check your application status, log into your Student Portal at /student-portal. Your dashboard will show your current application status, any required documents, and next steps.',
  'account': 'For account issues, you can reset your password at /forgot-password, or contact our support team at our contact form. You can also contact us at (317) 314-3757 during business hours.',
  'contact': 'You can reach our support team by: Email: our contact form, Phone: (317) 314-3757 (Mon-Fri 9am-5pm EST), or submit a support ticket at /support.',
  'default': 'Thank you for your message. For immediate assistance, please contact our support team at our contact form or call (317) 314-3757 during business hours (Mon-Fri 9am-5pm EST). You can also submit a support ticket at /support for a response within 24 hours.',
};

function getBotResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('apply') || lower.includes('application') || lower.includes('enroll')) {
    return botResponses['how do i apply'];
  }
  if (lower.includes('fund') || lower.includes('wioa') || lower.includes('pay') || lower.includes('cost') || lower.includes('tuition')) {
    return botResponses['funding'];
  }
  if (lower.includes('status') || lower.includes('check') || lower.includes('where')) {
    return botResponses['application status'];
  }
  if (lower.includes('account') || lower.includes('password') || lower.includes('login') || lower.includes('sign in')) {
    return botResponses['account'];
  }
  if (lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('reach')) {
    return botResponses['contact'];
  }
  return botResponses['default'];
}

export default function LiveChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am the Elevate support assistant. How can I help you today? You can ask about programs, funding, applications, or account issues.',
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

    // Simulate typing delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getBotResponse(messageText),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
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
        <Breadcrumbs items={[{ label: "Support", href: "/support" }, { label: "Chat" }]} />
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
              <p className="text-xs text-brand-blue-200 flex items-center gap-1">
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
                  message.role === 'user' ? 'bg-brand-blue-600' : 'bg-gray-200'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-brand-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 rounded-tl-sm'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-brand-blue-200' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
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
            <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => handleSend(reply)}
                  className="text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 hover:bg-white transition"
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
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
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
