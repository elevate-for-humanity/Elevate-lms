'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, ArrowRight, Check, RefreshCw } from 'lucide-react';
import AIPageBuilder from '@/components/AIPageBuilder';

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  options?: string[];
  inputType?: 'text' | 'select' | 'multiselect' | 'color';
  field?: string;
}

interface SiteData {
  organizationName?: string;
  organizationType?: string;
  industry?: string;
  targetAudience?: string;
  trainingTypes?: string;
  primaryColor?: string;
  description?: string;
}

const CONVERSATION_FLOW: Omit<Message, 'id'>[] = [
  {
    role: 'ai',
    content: "Hi! I'm going to build you a complete training platform in about 60 seconds. Let's start with the basics.",
  },
  {
    role: 'ai',
    content: "What's the name of your organization?",
    inputType: 'text',
    field: 'organizationName',
  },
  {
    role: 'ai',
    content: "What type of organization are you?",
    options: [
      'Training Provider',
      'Workforce Board',
      'Nonprofit',
      'Employer',
      'Educational Institution',
      'Apprenticeship Sponsor',
    ],
    inputType: 'select',
    field: 'organizationType',
  },
  {
    role: 'ai',
    content: "What industry do you focus on?",
    options: [
      'Healthcare',
      'Technology',
      'Manufacturing',
      'Construction & Trades',
      'Transportation',
      'Hospitality',
      'Finance',
      'Multiple Industries',
    ],
    inputType: 'select',
    field: 'industry',
  },
  {
    role: 'ai',
    content: "Who are your typical students?",
    options: [
      'Career changers',
      'High school graduates',
      'Veterans',
      'Unemployed adults',
      'Working professionals',
      'All of the above',
    ],
    inputType: 'select',
    field: 'targetAudience',
  },
  {
    role: 'ai',
    content: "What types of training do you offer? (You can list multiple)",
    inputType: 'text',
    field: 'trainingTypes',
  },
  {
    role: 'ai',
    content: "Pick a primary brand color (or I'll choose one for you):",
    inputType: 'color',
    field: 'primaryColor',
    options: ['#1e40af', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2'],
  },
  {
    role: 'ai',
    content: "Perfect! Give me a moment to build your site...",
  },
];

export default function BuildPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [siteData, setSiteData] = useState<SiteData>({});
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSite, setGeneratedSite] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Scroll within the messages container, not the whole page
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    // Start conversation
    if (messages.length === 0) {
      addAIMessage(0);
    }
  }, []);

  const addAIMessage = async (stepIndex: number) => {
    if (stepIndex >= CONVERSATION_FLOW.length) return;

    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    const step = CONVERSATION_FLOW[stepIndex];
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      ...step,
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
    setCurrentStep(stepIndex);

    // If this is the "building" message, trigger generation
    if (stepIndex === CONVERSATION_FLOW.length - 1) {
      generateSite();
    }

    // Auto-advance for intro message
    if (stepIndex === 0) {
      setTimeout(() => addAIMessage(1), 1000);
    }
  };

  const handleUserResponse = async (value: string, field?: string) => {
    if (!value.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: value,
    };
    setMessages(prev => [...prev, userMessage]);

    // Update site data
    if (field) {
      setSiteData(prev => ({ ...prev, [field]: value }));
    }

    setInputValue('');

    // Move to next step
    const nextStep = currentStep + 1;
    if (nextStep < CONVERSATION_FLOW.length) {
      setTimeout(() => addAIMessage(nextStep), 300);
    }
  };

  const generateSite = async () => {
    setIsGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siteData),
      });

      const data = await res.json();
      
      if (data.success) {
        setGeneratedSite(data);
        localStorage.setItem('sitePreviewConfig', JSON.stringify(data.config));
        
        // Add success message
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            role: 'ai',
            content: `Done! I've created "${siteData.organizationName}" - a complete training platform with courses, enrollment, and student management. Take a look! 👇`,
          }]);
          setIsGenerating(false);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  const currentMessage = messages[messages.length - 1];
  const showInput = currentMessage?.inputType && !isTyping && !isGenerating && !generatedSite;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <h1 className="sr-only">AI Platform Builder - Create Your Training Platform</h1>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Builder" }]} />
      </div>
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-800 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-900 font-bold">Elevate AI</p>
              <p className="text-slate-500 text-xs">Building your LMS</p>
            </div>
          </div>
          {siteData.organizationName && (
            <div className="text-right">
              <p className="text-slate-500 text-xs">Building</p>
              <p className="text-slate-900 font-medium">{siteData.organizationName}</p>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-brand-blue-600 text-white rounded-2xl rounded-br-md px-5 py-3'
                    : 'text-white'
                }`}
              >
                {message.role === 'ai' && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="space-y-3">
                      <p className="text-lg">{message.content}</p>
                      
                      {/* Options for select */}
                      {message.options && message.inputType === 'select' && message === currentMessage && !isTyping && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {message.options.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleUserResponse(option, message.field)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm transition-colors"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Color picker */}
                      {message.inputType === 'color' && message === currentMessage && !isTyping && (
                        <div className="flex flex-wrap gap-3 mt-3">
                          {message.options?.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleUserResponse(color, message.field)}
                              className="w-12 h-12 rounded-full border-4 border-transparent hover:border-white/50 transition-all hover:scale-110"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                          <button
                            onClick={() => handleUserResponse('#1e40af', message.field)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-sm"
                          >
                            Choose for me
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {message.role === 'user' && (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex gap-1 py-3">
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Generating animation */}
          {isGenerating && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-brand-blue-400 animate-spin" />
                  <span className="text-white">Building your platform...</span>
                </div>
                <div className="space-y-2 text-sm text-slate-400">
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green-400" /> Analyzing your requirements
                  </p>
                  <p className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green-400" /> Selecting template & colors
                  </p>
                  <p className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating content...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Generated site preview */}
          {generatedSite && !isGenerating && (
            <div className="mt-8">
              {/* Preview Card */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div 
                  className="p-6"
                  style={{ backgroundColor: generatedSite.config.branding.primaryColor }}
                >
                  <p className="text-slate-600 text-sm">Your new platform</p>
                  <h2 className="text-slate-900 text-2xl font-bold">
                    {generatedSite.config.branding.logoText}
                  </h2>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 mb-2">
                    {generatedSite.config.homepage.heroTitle}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {generatedSite.config.homepage.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {generatedSite.config.programs.slice(0, 3).map((p: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-white rounded-full text-sm text-slate-700">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <a
                  href={`/preview/${generatedSite.previewId}`}
                  className="flex-1 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  View Full Preview
                  <ArrowRight className="w-5 h-5" />
                </a>
                <button
                  onClick={() => {
                    setMessages([]);
                    setSiteData({});
                    setGeneratedSite(null);
                    setCurrentStep(0);
                    setTimeout(() => addAIMessage(0), 100);
                  }}
                  className="px-6 py-4 border border-white/20 hover:bg-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Start Over
                </button>
              </div>

              {/* Upgrade CTA */}
              <div className="mt-6 p-6 bg-white/20 border border-brand-green-500/30 rounded-xl">
                <p className="text-brand-green-400 font-bold mb-2">Ready to launch?</p>
                <p className="text-slate-600 text-sm mb-4">
                  Upgrade to publish your site and start enrolling students.
                </p>
                <a
                  href={`/store?preview=${generatedSite.previewId}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  Choose a Plan
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      {showInput && currentMessage?.inputType === 'text' && (
        <div className="border-t border-white/10 bg-white backdrop-blur sticky bottom-0">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserResponse(inputValue, currentMessage.field);
              }}
              className="flex gap-3"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                className="flex-1 px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-6 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Page Builder */}
      <div className="mt-8">
        <AIPageBuilder />
      </div>
    </div>
  );
}
