'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, Scissors } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BARBER_WELCOME = `Hi! I'm here to answer your questions about the Barber Apprenticeship program. 

I can help you with:
• Program requirements (2,000 hours)
• Pricing & payment plans
• How to get started

What would you like to know?`;

const BARBER_FAQ: Record<string, string> = {
  // Program basics
  'hours': `The Barber Apprenticeship requires **2,000 hours** of training:
• On-the-job training (OJT) at a licensed barbershop
• Related instruction (Milady theory curriculum)

At 40 hours/week, this takes about 50 weeks (12-15 months).
At 30 hours/week, it takes about 67 weeks (15-18 months).`,

  'cost|price|tuition|fee': `**Program Cost: $4,980**

• Setup Fee (35%): $1,743 - due at enrollment
• Remaining Balance: $3,237 - paid weekly

Weekly payment examples:
• 40 hrs/week: ~$64.74/week for 50 weeks
• 30 hrs/week: ~$48.31/week for 67 weeks

Payment plans are available. Contact us for employer-sponsored funding options.`,

  'wioa|wrg|funding|free|financial aid': `This is a **fee-based program** ($4,980 total).

**Payment Options:**
• Pay in full: $4,980 (card or bank transfer)
• Affirm/Klarna/Afterpay: Split into payments (terms set by lender)
• Setup fee + weekly: $1,743 setup fee, then weekly payments until complete

Payment is collected after your enrollment is approved.

Ready to get started? Apply at /forms/barber-apprenticeship-inquiry`,

  'requirements|qualify|eligible': `**Basic Requirements:**
• 18+ years old
• High school diploma or GED
• Valid government ID
• Pass background check
• Professional attitude

**No prior experience needed!** We train you from the basics.

You'll also need a host barbershop for your OJT hours. We can help match you with a partner shop.`,

  'license|state board|certification': `After completing 2,000 hours, you'll be eligible to take the **Indiana State Board Barber Exam**.

Upon passing, you receive your **Indiana Barber License**, allowing you to work as a licensed barber anywhere in Indiana.

We provide state board prep as part of the program.`,

  'shop|barbershop|where|location': `Training takes place at **licensed partner barbershops** in the Indianapolis area.

We'll help match you with a shop based on:
• Your location
• Your schedule
• Shop availability

Already have a shop in mind? They can apply to become a partner training site.`,

  'start|begin|enroll|apply': `**Ready to start?** Here's how:

1. Apply at /forms/barber-apprenticeship-inquiry
2. Speak with an enrollment advisor
3. Complete enrollment paperwork
4. Choose your payment plan
5. Get matched with a partner shop
6. Start training!

Payment is collected after your enrollment is approved.

Questions? Contact us: (317) 314-3757`,

  'schedule|hours per week|part time|full time': `You choose your schedule with your host shop:

• **Full-time (40 hrs/week)**: ~12-15 months to complete
• **Part-time (25-30 hrs/week)**: ~18-24 months to complete

Most apprentices work during regular shop hours. Your weekly payment amount is based on your schedule.`,

  'pay|earn|wage|salary': `Yes, you **earn while you learn**!

As a registered apprentice, you are a W-2 employee of your host shop. Your compensation is set by your employer and must meet or exceed applicable minimum wage laws — the platform does not set or suggest pay rates.

After licensure, barbers typically earn $35,000–$65,000+/year depending on location, clientele, and whether you rent a chair or own a shop.`,
};

export default function BarberChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: BARBER_WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const findAnswer = (question: string): string | null => {
    const q = question.toLowerCase();
    
    for (const [keywords, answer] of Object.entries(BARBER_FAQ)) {
      const keywordList = keywords.split('|');
      if (keywordList.some(kw => q.includes(kw))) {
        return answer;
      }
    }
    return null;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Check FAQ first
    const faqAnswer = findAnswer(userMessage);
    
    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: faqAnswer }]);
        setIsLoading(false);
      }, 500);
      return;
    }

    // Fall back to AI
    try {
      const response = await fetch('/api/chat/avatar-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: 'barber',
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm not sure about that. For specific questions, please contact us at (317) 314-3757 or email our contact form.",
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again or contact us at (317) 314-3757.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Program Cost', query: 'How much does it cost?' },
    { label: 'Payment Plans', query: 'What payment plans are available?' },
    { label: 'Requirements', query: 'What are the requirements?' },
    { label: 'How to Start', query: 'How do I get started?' },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-5 py-3 rounded-full shadow-lg transition-all hover:scale-105"
      >
        <div className="relative">
          <Scissors className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand-green-500 rounded-full animate-pulse" />
        </div>
        <span className="font-medium">Questions?</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[calc(100%-3rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all ${
        isMinimized ? 'h-14' : 'h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-blue-600 to-brand-blue-700 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm">Barber Program Assistant</div>
            <div className="text-xs text-brand-blue-200">Ask me anything</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-brand-blue-500 rounded-full transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-brand-blue-500 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 h-[340px] bg-white">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-brand-blue-600 text-white rounded-br-md'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 px-4 py-2 rounded-2xl rounded-bl-md border border-slate-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-slate-100 bg-white">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(action.query);
                      setTimeout(() => handleSend(), 100);
                    }}
                    className="text-xs px-3 py-1.5 bg-brand-blue-50 text-brand-blue-700 rounded-full hover:bg-brand-blue-100 transition"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
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
                placeholder="Ask about the program..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
