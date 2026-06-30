import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, Zap, Target, TrendingUp, Users, Shield, ChevronRight, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `AI Career Navigator | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'AI-powered career guidance that matches skills to in-demand jobs. Get personalized career pathways, training recommendations, and job market insights.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/ai' },
};

const features = [
  {
    icon: Brain,
    title: 'Skills Assessment',
    desc: 'AI analyzes current skills and experience to identify career matches.',
  },
  {
    icon: Target,
    title: 'Personalized Pathways',
    desc: 'Get training program recommendations tailored to your career goals.',
  },
  {
    icon: TrendingUp,
    title: 'Job Market Insights',
    desc: 'Real-time data on in-demand jobs, salaries, and growth projections.',
  },
  {
    icon: Zap,
    title: 'Instant Matching',
    desc: 'Connect to programs and employers within seconds.',
  },
];

const benefits = [
  'Free career assessment in under 5 minutes',
  'Matches to WIOA-eligible training programs',
  'Connects to local employer job openings',
  'Tracks progress toward career goals',
  'Updates recommendations based on market changes',
];

export default function AIPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Brain className="w-4 h-4" /> AI-Powered Career Guidance
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Find Your Career Path with AI
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            Our AI Career Navigator matches your skills to in-demand jobs and creates personalized training pathways. Free for Indiana residents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ai-chat" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              Start Free Assessment
            </Link>
            <Link href="#features" className="border-2 border-white/30 text-white hover:bg-white/10 font-bold px-8 py-4 rounded-xl transition-colors text-lg">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-4">How AI Career Navigator Works</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Our AI guides you through career discovery and connects you to the right training programs.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <f.icon className="w-10 h-10 text-brand-red-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Why Use AI Career Navigator?</h2>
              <ul className="space-y-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-brand-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{b}</span>
                  </li>
                ))}
              </ul>
              <Link href="/ai-chat" className="mt-8 inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
                Try It Free <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-8 h-8 text-brand-red-400" />
                <div>
                  <div className="font-bold text-lg">12,500+</div>
                  <div className="text-slate-400 text-sm">Hoosiers matched to careers</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-brand-red-400" />
                <div>
                  <div className="font-bold text-lg">87%</div>
                  <div className="text-slate-400 text-sm">Completion rate</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-brand-red-400" />
                <div>
                  <div className="font-bold text-lg">Free</div>
                  <div className="text-slate-400 text-sm">WIOA funding available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Discover Your Career Path?</h2>
          <p className="text-lg text-red-100 mb-8">Start your free AI-powered career assessment today.</p>
          <Link href="/ai-chat" className="inline-block bg-white text-brand-red-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-colors text-lg">
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  );
}
