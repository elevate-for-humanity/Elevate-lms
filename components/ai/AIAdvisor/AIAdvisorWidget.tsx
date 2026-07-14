'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SuggestedQuestion {
  question: string;
  category: string;
}

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { question: "How much does barber training cost?", category: "funding" },
  { question: "Can I work while in training?", category: "apprenticeship" },
  { question: "What funding options do I have?", category: "funding" },
  { question: "How long does the program take?", category: "programs" },
  { question: "Will I get a job after graduation?", category: "career" },
  { question: "What certifications will I earn?", category: "programs" },
];

const INITIAL_GREETING = "Hi! I'm your Elevate career advisor. I can help you find the right program, understand funding options, or answer questions about apprenticeships. What would you like to know?";

export function AIAdvisorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: INITIAL_GREETING, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (question?: string) => {
    const userMessage = question || input;
    if (!userMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const response = generateResponse(userMessage);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('cost') || q.includes('price') || q.includes('tuition') || q.includes('pay')) {
      return "Great question about cost! Many students pay $0 through WIOA funding, Vocational Rehabilitation, or employer sponsorship. We also offer payment plans starting at $179/month. Most students qualify for some form of financial assistance. Want me to help you check your eligibility?";
    }
    
    if (q.includes('work') && (q.includes('while') || q.includes('during'))) {
      return "Yes! That's one of the best parts about our apprenticeship programs. You can earn $14-18/hour while you train at a real workplace. Unlike traditional school where you pay to learn, you'll actually get PAID to gain experience. The barbering apprenticeship takes 12-18 months, and you work 40 hours a week at a partner salon.";
    }
    
    if (q.includes('funding') || q.includes('wioa') || q.includes('eligible') || q.includes('qualify')) {
      return "We have several funding options! WIOA (Workforce Innovation and Opportunity Act) covers full tuition for qualifying individuals. Vocational Rehabilitation can cover training for people with disabilities. Many employers also sponsor their employees' training. The best way to find out what you qualify for is our free 60-second eligibility quiz. Want me to direct you there?";
    }
    
    if (q.includes('how long') || q.includes('duration') || q.includes('time') || q.includes('months')) {
      return "Program length varies by path. Our barbering apprenticeship takes 12-18 months working 40 hours/week. Traditional programs like HVAC or medical assisting can be 6-12 months. CDL training is typically 4-8 weeks. Apprenticeship programs let you earn while you train, which is why many students prefer that route.";
    }
    
    if (q.includes('job') || q.includes('hire') || q.includes('employ') || q.includes('career') || q.includes('placement')) {
      return "Job placement is one of our strengths! 95% of our apprenticeship graduates are hired by their host shop when they complete. We have partnerships with 75+ employers in Indianapolis including Great Clips, Sport Clips, and many local businesses. We also help with resume writing, interview prep, and connecting you with hiring partners.";
    }
    
    if (q.includes('certif') || q.includes('license')) {
      return "You'll earn industry-recognized credentials! For barbering, you'll receive your Indiana barber license after passing the state board exam. HVAC students get EPA 608 certification. Medical assistants can earn CCMA or RMA credentials. These certifications are recognized nationwide and help you get hired immediately.";
    }
    
    if (q.includes('help') || q.includes('advisor') || q.includes('talk') || q.includes('human')) {
      return "I'd love to connect you with a human advisor! You can text us at (317) 314-3757, call us, or schedule a free consultation. Our admissions team can answer any question and help you find the best path for your situation. Would you like me to show you how to reach us?";
    }
    
    return "That's a great question! Based on what you've told me, I think our Barbering Registered Apprenticeship might be a perfect fit - you can earn $14-18/hour while you train, and most students pay nothing upfront. Would you like to learn more about this program, or do you have other questions I can help with?";
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-24 right-4 z-40
          w-14 h-14 rounded-full bg-brand-blue-600 text-white shadow-lg
          flex items-center justify-center
          transition-all duration-300 hover:scale-110 hover:shadow-xl
          md:bottom-6 md:right-6
          ${isOpen ? 'rotate-90' : ''}
        `}
        aria-label={isOpen ? 'Close chat' : 'Open AI advisor'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      <div 
        className={`
          fixed bottom-40 right-4 z-40 w-[calc(100%-2rem)] sm:w-96 md:w-[420px]
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4 pointer-events-none'
          }
          md:bottom-6 md:right-6
        `}
      >
        <Card className="bg-white shadow-2xl overflow-hidden h-[600px] max-h-[calc(100vh-200px)] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-blue-700 to-brand-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Career Advisor</h3>
                <p className="text-xs text-blue-200">AI-powered guidance</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-3
                    ${message.role === 'user' 
                      ? 'bg-brand-blue-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                    }
                  `}
                >
                  <div className="flex items-start gap-2">
                    {message.role === 'assistant' && (
                      <Bot className="w-4 h-4 mt-1 text-brand-blue-600 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="w-4 h-4 mt-1 text-blue-200 flex-shrink-0" />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && messages.length === 1 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">Suggested questions:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_QUESTIONS.slice(0, 4).map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sq.question)}
                      className="text-xs bg-white border border-brand-blue-200 text-brand-blue-700 px-3 py-1.5 rounded-full hover:bg-brand-blue-50 transition-colors"
                    >
                      {sq.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-brand-blue-600 text-white flex items-center justify-center hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>Powered by AI</span>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="hover:text-brand-blue-600"
              >
                Talk to human
              </button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

export default AIAdvisorWidget;
