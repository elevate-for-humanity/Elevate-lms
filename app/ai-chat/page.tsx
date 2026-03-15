import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  MessageSquare, Bot, Sparkles, Clock, BookOpen, 
  HelpCircle, ArrowRight, Zap, Phone
} from 'lucide-react';
import ChatAssistantWrapper from './ChatAssistantWrapper';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/ai-chat',
  },
  title: 'AI Learning Assistant | Elevate For Humanity',
  description: 'Get instant help with your courses, career questions, and learning journey from our AI-powered assistant.',
};

const features = [
  {
    icon: BookOpen,
    title: 'Course Help',
    description: 'Get explanations for difficult concepts, quiz prep, and study tips',
  },
  {
    icon: HelpCircle,
    title: 'Career Guidance',
    description: 'Ask about career paths, certifications, and job opportunities',
  },
  {
    icon: Clock,
    title: '24/7 Available',
    description: 'Get help anytime, day or night, whenever you need it',
  },
  {
    icon: Zap,
    title: 'Instant Answers',
    description: 'No waiting - get immediate responses to your questions',
  },
];

const sampleQuestions = [
  "What certifications should I get for healthcare?",
  "Explain the WIOA eligibility requirements",
  "How do I prepare for the CNA exam?",
  "What career paths are available after completing CDL training?",
  "Help me understand this course material",
  "What funding options are available for my training?",
];

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'AI Learning Assistant' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-white text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Powered by AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Your Personal Learning Assistant
          </h1>
          <p className="text-xl text-brand-blue-100 mb-8 max-w-2xl mx-auto">
            Get instant help with courses, career questions, and your learning journey. 
            Available 24/7 to support your success.
          </p>
          <Link
            href="/ai-tutor"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-blue-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Start Chatting
          </Link>
        </div>
      </section>

      {/* Chat Preview */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            {/* Chat Header */}
            <div className="bg-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Elevate AI Assistant</h3>
                <p className="text-brand-blue-200 text-sm">Always here to help</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="p-6 space-y-4 bg-white">
              {/* AI Message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm max-w-md">
                  <p className="text-gray-700">
                    Hi! I'm your AI learning assistant. I can help you with:
                  </p>
                  <ul className="mt-2 space-y-1 text-gray-600 text-sm">
                    <li>• Course content and study tips</li>
                    <li>• Career guidance and job search</li>
                    <li>• Program information and eligibility</li>
                    <li>• Technical support</li>
                  </ul>
                  <p className="mt-2 text-gray-700">What can I help you with today?</p>
                </div>
              </div>

              {/* User Message */}
              <div className="flex gap-3 justify-end">
                <div className="bg-white text-white rounded-2xl rounded-tr-none p-4 max-w-md">
                  <p>What certifications should I get for a healthcare career?</p>
                </div>
              </div>

              {/* AI Response */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm max-w-md">
                  <p className="text-gray-700">
                    Great question! For healthcare careers, I recommend starting with:
                  </p>
                  <ul className="mt-2 space-y-2 text-gray-600 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span><strong>CNA (Certified Nursing Assistant)</strong> - Entry-level, high demand</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span><strong>CPR/First Aid</strong> - Required for most healthcare roles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span><strong>Phlebotomy</strong> - Quick certification, good pay</span>
                    </li>
                  </ul>
                  <p className="mt-2 text-gray-700">
                    Would you like me to tell you more about any of these programs?
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  disabled
                />
                <Link
                  href="/ai-tutor"
                  className="px-6 py-3 bg-brand-blue-600 text-white rounded-full font-semibold hover:bg-brand-blue-700 transition-colors"
                >
                  Start Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How AI Assistant Helps You</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-brand-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Questions */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Try Asking</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {sampleQuestions.map((question, index) => (
              <Link
                key={index}
                href="/ai-tutor"
                className="flex items-center gap-3 p-4 bg-white rounded-xl border hover:border-brand-blue-300 hover:shadow-md transition-all"
              >
                <MessageSquare className="w-5 h-5 text-brand-blue-600 flex-shrink-0" />
                <span className="text-gray-700">{question}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-brand-blue-100 mb-8">
            Your AI learning assistant is ready to help you succeed.
          </p>
          <Link
            href="/ai-tutor"
            className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-blue-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Start Chatting Now
          </Link>
        </div>
      </section>
      {/* Live Chat Assistant */}
      <ChatAssistantWrapper />

      {/* CTA Section */}
      <section className="bg-white text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-brand-blue-100 mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-white transition"
            >
              Apply Now
            </Link>
            <a
              href="/support"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition"
            >
              <Phone className="w-4 h-4" />
              (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
