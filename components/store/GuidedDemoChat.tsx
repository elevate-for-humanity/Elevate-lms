'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, X, ChevronRight, Play, Pause, SkipForward } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DemoStep {
  id: string;
  message: string;
  route?: string;
  highlight?: string;
  action?: string;
  delay?: number;
}

// Hook to log demo interactions
function useDemoAnalytics() {
  const supabase = createClient();
  const sessionId = useRef(crypto.randomUUID());

  const logDemoEvent = async (eventType: string, stepId?: string, data?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('demo_analytics')
      .insert({
        session_id: sessionId.current,
        user_id: user?.id,
        event_type: eventType,
        step_id: stepId,
        extra_data: data,
        timestamp: new Date().toISOString()
      });
  };

  return { logDemoEvent, sessionId: sessionId.current };
}

const DEMO_SCRIPT: DemoStep[] = [
  {
    id: 'welcome',
    message: "Welcome! I'll walk you through our workforce training platform. We'll look at it from three perspectives: learner, admin, and employer. Ready to start?",
    delay: 0,
  },
  {
    id: 'store-intro',
    message: "This is our store. We offer digital products for career development, but the main offering is platform licensing — a white-label LMS built specifically for workforce training.",
    route: '/store',
    highlight: '.license-card',
    delay: 3000,
  },
  {
    id: 'store-tiers',
    message: "We have three tiers: Core Platform at $4,999, School License at $15,000, and Enterprise at $50,000. There's also a monthly option at $499/mo.",
    highlight: '.pricing-section',
    delay: 4000,
  },
  {
    id: 'license-page',
    message: "Let me show you the licensing overview. The platform is built for training providers, workforce organizations, and employer partners.",
    route: '/license',
    delay: 3000,
  },
  {
    id: 'license-features',
    message: "The platform includes LMS delivery, program management, intake workflows, and employer partnerships — all in one system.",
    highlight: '.features-section',
    delay: 4000,
  },
  {
    id: 'demo-hub',
    message: "Now let's see the platform in action. I'll show you the learner experience first.",
    route: '/store/demo',
    delay: 3000,
  },
  {
    id: 'learner-demo',
    message: "This is what a learner sees. They have their program dashboard, progress tracking, and funding pathway information. Everything a participant needs is in one place.",
    route: '/store/demo/student',
    highlight: '.progress-section',
    delay: 5000,
  },
  {
    id: 'admin-demo',
    message: "Now the admin view. Program managers see their programs, enrollment pipeline, and reporting tools. Compliance reporting is built in.",
    route: '/store/demo/admin',
    highlight: '.pipeline-section',
    delay: 5000,
  },
  {
    id: 'ai-features',
    message: "We also have AI-powered features: AI instructors, course generation, video creation, and 24/7 AI tutoring for students.",
    route: '/ai-studio',
    delay: 4000,
  },
  {
    id: 'community',
    message: "The Community Hub lets you build a learning community with forums, marketplace, and member management.",
    route: '/community',
    delay: 3000,
  },
  {
    id: 'pricing',
    message: "For pricing: Core Platform starts at $4,999 for single-site deployment. School License at $15,000 includes white-label branding. Enterprise at $50,000 adds the employer portal and AI tutor.",
    route: '/license/pricing',
    delay: 5000,
  },
  {
    id: 'schedule',
    message: "Ready to discuss your specific use case? You can schedule a call with our team, or I can answer any questions you have right now.",
    route: '/schedule',
    delay: 3000,
  },
  {
    id: 'closing',
    message: "What questions do you have? Type below or click 'Schedule Call' to book a follow-up.",
    delay: 0,
  },
];

export function GuidedDemoChat() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showStartPrompt, setShowStartPrompt] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const startDemo = () => {
    setShowStartPrompt(false);
    setIsPlaying(true);
    setMessages([{ role: 'bot', text: DEMO_SCRIPT[0].message }]);
    setCurrentStep(0);
  };

  const playNextStep = () => {
    if (currentStep >= DEMO_SCRIPT.length - 1) {
      setIsPlaying(false);
      return;
    }

    const nextStep = currentStep + 1;
    const step = DEMO_SCRIPT[nextStep];

    // Navigate if route specified
    if (step.route) {
      router.push(step.route);
    }

    // Add message
    setMessages(prev => [...prev, { role: 'bot', text: step.message }]);
    setCurrentStep(nextStep);

    // Auto-advance if playing
    if (isPlaying && step.delay && step.delay > 0) {
      timeoutRef.current = setTimeout(() => {
        playNextStep();
      }, step.delay);
    }
  };

  useEffect(() => {
    if (isPlaying && currentStep === 0 && messages.length === 1) {
      const step = DEMO_SCRIPT[0];
      if (step.delay && step.delay > 0) {
        timeoutRef.current = setTimeout(() => {
          playNextStep();
        }, step.delay || 3000);
      } else {
        // First step has no delay, wait for user
        timeoutRef.current = setTimeout(() => {
          playNextStep();
        }, 3000);
      }
    }
  }, [isPlaying, currentStep, messages.length]);

  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      setIsPlaying(true);
      playNextStep();
    }
  };

  const skipToNext = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playNextStep();
  };

  const handleUserInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: userInput }]);
    
    // Simple response logic
    const input = userInput.toLowerCase();
    let response = "Great question! Let me help you with that. Would you like to schedule a call to discuss in detail?";
    
    if (input.includes('price') || input.includes('cost')) {
      response = "Our pricing starts at $4,999 for Core Platform, $15,000 for School License with white-label, and $50,000 for Enterprise with AI features. Monthly option is $499/mo. Final pricing depends on your specific needs.";
    } else if (input.includes('salesforce') || input.includes('integration')) {
      response = "Salesforce integration is supported via API and webhooks. The specific implementation depends on your Salesforce configuration — we'd scope that during implementation planning.";
    } else if (input.includes('trial') || input.includes('free')) {
      response = "We offer live demos like this one, and the demo pages are publicly accessible. For a hands-on trial, we'd discuss that as part of the licensing conversation.";
    } else if (input.includes('custom')) {
      response = "White-label branding is included with School License and above. Additional customization beyond standard configuration is available through implementation support.";
    } else if (input.includes('compliance') || input.includes('report')) {
      response = "The platform includes enrollment reports, completion tracking, attendance records, and data exports. Specific compliance requirements vary by funding source — we'd discuss your needs during scoping.";
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 500);

    setUserInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all"
      >
        <Play className="w-5 h-5" />
        <span className="font-semibold">Start Guided Demo</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-semibold">Platform Demo</span>
        </div>
        <div className="flex items-center gap-2">
          {!showStartPrompt && (
            <>
              <button
                onClick={togglePlayPause}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={skipToNext}
                className="p-1.5 hover:bg-white/20 rounded-lg transition"
                title="Next"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!showStartPrompt && (
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / DEMO_SCRIPT.length) * 100}%` }}
          />
        </div>
      )}

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {showStartPrompt ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to the Platform Demo
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              I'll walk you through our workforce training platform in about 10 minutes.
            </p>
            <button
              onClick={startDemo}
              className="bg-gradient-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Start Demo Tour
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">E</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      {!showStartPrompt && (
        <form onSubmit={handleUserInput} className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => router.push('/schedule')}
              className="flex-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Schedule a Call
            </button>
            <button
              type="button"
              onClick={() => router.push('/store/licenses')}
              className="flex-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View Pricing
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
