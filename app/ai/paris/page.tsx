import { Metadata } from 'next';
import Link from 'next/link';
import { SEO } from '@/components/SEO';

export const metadata: Metadata = {
  title: 'PARIS AI | Your Workforce AI Advisor',
  description: 'Intelligent career guidance, program matching, and student support powered by Claude AI. Transform workforce development with personalized AI assistance.',
};

const features = [
  {
    title: 'Career Pathway Intelligence',
    description: 'AI analyzes skills, interests, and market data to recommend optimal career pathways.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Program Matching',
    description: 'Automatically match candidates with suitable training programs based on goals and eligibility.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    title: 'Funding Eligibility Checks',
    description: 'Instantly determine WIOA, Pell, and scholarship eligibility to remove financial barriers.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: '24/7 Student Support',
    description: 'AI-powered chat answers questions about programs, applications, and career goals anytime.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Application Assistance',
    description: 'Guides applicants through enrollment with smart forms, document collection, and status tracking.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: 'Progress Monitoring',
    description: 'Track student journey from application to graduation with real-time analytics.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const useCases = [
  {
    title: 'Career Centers',
    description: 'Staff can use PARIS AI to provide instant career guidance to job seekers without lengthy intake processes.',
    icon: '🏢',
  },
  {
    title: 'Workforce Boards',
    description: 'Automate eligibility screening and program referrals for WIOA participants.',
    icon: '🏛️',
  },
  {
    title: 'Training Providers',
    description: 'AI assists with enrollment, retention, and student success initiatives.',
    icon: '🎓',
  },
  {
    title: 'Employers',
    description: 'Connect employees with upskilling opportunities that match their career goals.',
    icon: '💼',
  },
];

export default function PARISPage() {
  return (
    <div className="min-h-screen">
      <SEO
        title="PARIS AI"
        description="Intelligent career guidance, program matching, and student support powered by Claude AI."
        breadcrumb={[{ name: 'AI Platform', url: '/ai' }, { name: 'PARIS AI', url: '/ai/paris' }]}
      />
      
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Powered by Claude AI
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">PARIS AI</span>
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Your intelligent workforce advisor. PARIS AI guides career seekers through training programs, 
                funding options, and career pathways—powered by Claude AI.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/apply" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:opacity-90 transition">
                  Start Your Journey
                </Link>
                <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">
                  Request Demo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-slate-800/50 backdrop-blur rounded-2xl border border-white/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="ml-2 text-sm text-slate-400">PARIS AI Chat</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-purple-600/30 rounded-lg p-4 text-sm">
                    <p>Hi! I'm PARIS, your AI workforce advisor. What career path interests you?</p>
                  </div>
                  <div className="bg-blue-600/30 rounded-lg p-4 text-sm ml-8">
                    <p>I'm interested in healthcare but unsure which program is right for me.</p>
                  </div>
                  <div className="bg-purple-600/30 rounded-lg p-4 text-sm">
                    <p>Based on your goals, I'd recommend exploring our Medical Assistant or CNA programs. Would you like me to check your funding eligibility?</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">AI-Powered Capabilities</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              PARIS AI transforms workforce development with intelligent automation at every step.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-200 hover:shadow-lg transition-all">
                <div className="text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for the Workforce Ecosystem</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              PARIS AI serves career centers, workforce boards, training providers, and employers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase) => (
              <div key={useCase.title} className="flex gap-4 p-6 bg-white rounded-xl border border-slate-200">
                <div className="text-4xl">{useCase.icon}</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{useCase.title}</h3>
                  <p className="text-slate-600 text-sm">{useCase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Workforce Services?</h2>
          <p className="text-xl text-purple-100 mb-8">
            Deploy PARIS AI to serve your community with intelligent career guidance.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply" className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition">
              Start Using PARIS AI
            </Link>
            <Link href="/platform/enterprise" className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Enterprise Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
