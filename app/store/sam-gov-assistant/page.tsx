'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  Building2,
  CreditCard,
  Users,
  Shield,
  ExternalLink,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { SAM_GOV_WALKTHROUGH_STEPS } from '@/lib/store/digital-products';

interface Message {
  id: string;
  type: 'assistant' | 'user';
  content: string;
  options?: string[];
}

// Map user responses to next step IDs
const RESPONSE_MAP: Record<string, string> = {
  // Welcome
  'Yes, I have Login.gov': 'goto-sam',
  'No, I need to create one': 'create-logingov',
  
  // Login.gov creation
  'Done - I created my Login.gov account': 'goto-sam',
  "I'm having trouble": 'logingov-trouble',
  'Yes, let me try again': 'create-logingov',
  
  // SAM.gov access
  "Yes, I'm in SAM.gov": 'start-registration',
  "The site isn't loading": 'sam-loading-issue',
  "I can't sign in": 'logingov-trouble',
  'Let me try again': 'goto-sam',
  "It's working now": 'start-registration',
  
  // Registration start
  'I see the registration form': 'enter-core-data',
  'I see "Get Unique Entity ID" option': 'get-uei-first',
  "I'm confused about what to click": 'get-uei-first',
  
  // UEI
  "Yes, I'm getting my UEI": 'uei-info-needed',
  'What info do I need for UEI?': 'uei-info-needed',
  'Yes, I have this info': 'enter-core-data',
  'How do I get an EIN?': 'get-ein',
  'Yes, I have my EIN': 'enter-core-data',
  "I'll get my EIN and come back": 'complete',
  
  // Core data
  'Yes, entering core data now': 'mailing-address',
  'What about mailing address?': 'mailing-address',
  "Done with addresses, what's next?": 'entity-info',
  
  // Entity info
  'Yes, what about small business status?': 'small-business',
  "Done, what's next?": 'naics-codes',
  "Got it, what's next?": 'naics-codes',
  
  // NAICS
  'Added my NAICS codes': 'financial-info',
  'How do I find the right codes?': 'find-naics',
  'Yes, added my codes': 'financial-info',
  "I'll use the training codes you suggested": 'financial-info',
  
  // Financial
  'Yes, entering bank info': 'points-of-contact',
  'Can I skip this for now?': 'skip-financial',
  "I'll enter my bank info now": 'points-of-contact',
  "I'll add it later and continue": 'points-of-contact',
  
  // Contacts
  'Yes, adding contacts': 'certifications',
  'Can I be all the contacts?': 'same-contact',
  'Got it, adding myself as contacts': 'certifications',
  
  // Certifications
  'Completing certifications now': 'review-submit',
  "What if I'm unsure about an answer?": 'cert-unsure',
  "I'll answer carefully and continue": 'review-submit',
  
  // Review
  'Submitting now!': 'submitted',
  'I found an error, how do I fix it?': 'fix-error',
  'Fixed it, ready to submit': 'submitted',
  
  // Post-submission
  'What do I do while waiting?': 'while-waiting',
  "What's next after activation?": 'after-activation',
  'Got it, what about Grants.gov?': 'after-activation',
  
  // After activation
  'Tell me about Grants.gov': 'grants-gov-info',
  'How do I renew SAM.gov?': 'renew-sam',
  "I'm all set, thanks!": 'complete',
  
  // Grants.gov
  'Yes, help me find grants': 'grants-gov-info',
  "I'll explore on my own": 'renew-sam',
  
  // Renew
  "Thanks, I'll set a reminder": 'complete',
  'Start over from beginning': 'welcome',
  "I'm done!": 'complete',
  
  // Final
  'Start over': 'welcome',
  "I'm done, thanks!": 'complete',
};

export default function SamGovAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStepId, setCurrentStepId] = useState('welcome');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeStep = SAM_GOV_WALKTHROUGH_STEPS.find(s => s.id === 'welcome');
    if (welcomeStep) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: welcomeStep.message,
        options: welcomeStep.options,
      }]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = (option: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: option,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Determine next step
    const nextStepId = RESPONSE_MAP[option] || 'complete';
    
    // Special handling for "Start over"
    if (option === 'Start over' || option === 'Start over from beginning') {
      setTimeout(() => {
        const welcomeStep = SAM_GOV_WALKTHROUGH_STEPS.find(s => s.id === 'welcome');
        if (welcomeStep) {
          setMessages([{
            id: 'welcome-reset',
            type: 'assistant',
            content: welcomeStep.message,
            options: welcomeStep.options,
          }]);
          setCurrentStepId('welcome');
        }
        setIsTyping(false);
      }, 500);
      return;
    }

    // Special handling for "I'm done"
    if (option === "I'm done, thanks!" || option === "I'm done!") {
      setTimeout(() => {
        const thankYouMessage: Message = {
          id: `thanks-${Date.now()}`,
          type: 'assistant',
          content: `You're welcome! Good luck with your SAM.gov registration and federal funding journey.

**Bookmark these links:**
- [SAM.gov](https://sam.gov) - Registration site
- [Grants.gov](https://grants.gov) - Find grants
- [Login.gov](https://login.gov) - Manage login

Come back anytime if you need help!`,
        };
        setMessages((prev) => [...prev, thankYouMessage]);
        setIsTyping(false);
      }, 500);
      return;
    }

    // Find and show next step
    setTimeout(() => {
      const nextStep = SAM_GOV_WALKTHROUGH_STEPS.find(s => s.id === nextStepId);
      if (nextStep) {
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: nextStep.message,
          options: nextStep.options,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setCurrentStepId(nextStepId);
      }
      setIsTyping(false);
    }, 800);
  };

  const resetChat = () => {
    const welcomeStep = SAM_GOV_WALKTHROUGH_STEPS.find(s => s.id === 'welcome');
    if (welcomeStep) {
      setMessages([{
        id: 'welcome-reset',
        type: 'assistant',
        content: welcomeStep.message,
        options: welcomeStep.options,
      }]);
      setCurrentStepId('welcome');
    }
  };

  // Calculate progress
  const stepIds = SAM_GOV_WALKTHROUGH_STEPS.map(s => s.id);
  const currentIndex = stepIds.indexOf(currentStepId);
  const progress = Math.round(((currentIndex + 1) / stepIds.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Store", href: "/store" }, { label: "Sam Gov Assistant" }]} />
      </div>
{/* Hero */}
      <section className="bg-slate-100 text-slate-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-bold mb-4 border border-white/20">
              <Shield className="w-4 h-4" />
              Premium Tool - $149/month
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
              SAM.gov Registration
              <span className="block text-brand-blue-300">Step-by-Step Guide</span>
            </h1>
            <p className="text-lg text-brand-blue-100 mb-6">
              I'll walk you through every step of registering your organization in SAM.gov for federal grants and contracts.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-brand-blue-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Interactive walkthrough
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Real-time guidance
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Troubleshooting help
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Prerequisites - Collapsible on mobile */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <h2 className="text-xl font-bold text-gray-900">
                What You'll Need
              </h2>
              <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">EIN Number</h3>
                <p className="text-xs text-gray-600">
                  Tax ID from IRS (free at irs.gov)
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Business Address</h3>
                <p className="text-xs text-gray-600">
                  Physical location (no PO Box)
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-5 h-5 text-brand-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Bank Account</h3>
                <p className="text-xs text-gray-600">
                  For receiving payments
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Contact Info</h3>
                <p className="text-xs text-gray-600">
                  Name, phone, email
                </p>
              </div>
            </div>
          </details>
        </div>
      </section>

      {/* Chat Interface */}
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-brand-blue-600 text-white px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">SAM.gov Assistant</h3>
                    <p className="text-sm text-brand-blue-200">
                      Here to help you register
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetChat}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Restart</span>
                </button>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-brand-blue-200 mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-brand-blue-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[400px] sm:h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-brand-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <div
                      className="prose prose-sm max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ul]:ml-4 [&_li]:mb-1"
                      style={{ 
                        color: message.type === 'user' ? 'white' : 'inherit',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n\n/g, '</p><p>')
                          .replace(/\n- /g, '</p><ul><li>')
                          .replace(/\n(\d+)\. /g, '</p><ol><li>')
                          .replace(/\n/g, '<br />')
                          .replace(/<\/li><br \/>/g, '</li><li>')
                          .replace(/<li>([^<]+)$/gm, '<li>$1</li></ul>')
                      }}
                    />
                    {message.options && message.options.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.options.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(option)}
                            disabled={isTyping}
                            className="w-full text-left px-4 py-3 bg-brand-blue-50 border border-brand-blue-200 rounded-xl hover:bg-brand-blue-100 hover:border-brand-blue-300 transition-colors text-sm font-medium text-brand-blue-900 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span>{option}</span>
                            <ArrowRight className="w-4 h-4 text-brand-blue-400 group-hover:text-brand-blue-600 transition-colors flex-shrink-0 ml-2" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <a
              href="https://sam.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">SAM.gov</span>
              <span className="sm:hidden">SAM</span>
            </a>
            <a
              href="https://login.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Login.gov</span>
              <span className="sm:hidden">Login</span>
            </a>
            <a
              href="https://grants.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Grants.gov</span>
              <span className="sm:hidden">Grants</span>
            </a>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Related Resources
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link
              href="/store/digital/grant-guide"
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Grant Readiness Guide
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Prepare winning grant applications with our compliance checklist.
              </p>
              <span className="text-brand-blue-600 font-semibold text-sm">
                Learn More →
              </span>
            </Link>
            <Link
              href="/grants"
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Grants Overview
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Learn about grant opportunities and funding for your programs.
              </p>
              <span className="text-brand-blue-600 font-semibold text-sm">
                Explore →
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
