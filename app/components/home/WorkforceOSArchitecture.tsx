import Link from 'next/link';
import Image from 'next/image';
import { 
  Bot, 
  GraduationCap, 
  Building2, 
  FileBadge2, 
  TrendingUp,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI-Powered Matching',
    description: 'Smart algorithms connect you with programs and careers that fit your skills and goals.',
    color: 'bg-blue-500',
  },
  {
    icon: GraduationCap,
    title: 'Credential Ecosystem',
    description: 'Industry-recognized certifications and micro-credentials that employers value.',
    color: 'bg-emerald-500',
  },
  {
    icon: Building2,
    title: 'Employer Partnerships',
    description: 'Direct connections to hiring employers seeking trained talent like you.',
    color: 'bg-purple-500',
  },
  {
    icon: FileBadge2,
    title: 'Digital Records',
    description: 'Blockchain-verified credentials that travel with you throughout your career.',
    color: 'bg-amber-500',
  },
  {
    icon: TrendingUp,
    title: 'Career Growth',
    description: 'Pathways from entry-level to advanced certifications and leadership.',
    color: 'bg-rose-500',
  },
];

export function WorkforceOSArchitecture() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-brand-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-brand-red-100 text-brand-red-700 text-sm font-semibold rounded-full mb-4">
            🚀 THE WORKFORCE OS
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
            More Than Just
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red-600 to-rose-600">
              {' '}Training
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Elevate is a complete workforce operating system that guides you from initial interest through career success — with AI assistance at every step.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="relative mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className="relative group"
              >
                {/* Connector Line (not on last row items) */}
                {index < FEATURES.length - 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-300 to-transparent" />
                )}

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl hover:border-brand-red-200 transition-all duration-300 group-hover:-translate-y-1">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.color} text-white mb-4 shadow-lg`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Your Journey with Elevate</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Discover', desc: 'Explore programs that match your interests' },
              { step: 2, title: 'Apply', desc: 'Complete your application with AI assistance' },
              { step: 3, title: 'Learn', desc: 'Train with expert instructors and real skills' },
              { step: 4, title: 'Succeed', desc: 'Earn credentials and land your career' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-red-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors"
            >
              See How It Works
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
