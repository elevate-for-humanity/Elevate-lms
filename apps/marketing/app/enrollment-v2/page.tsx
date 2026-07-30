import Link from 'next/link';
import { CheckCircle, ArrowRight, GraduationCap, FileText, DollarSign, Calendar, Users } from 'lucide-react';

export default function EnrollmentV2Hub() {
  const steps = [
    {
      step: 1,
      icon: GraduationCap,
      title: 'Choose Your Program',
      description: 'Select from healthcare, trades, beauty, or testing programs that match your career goals.',
      cta: 'Browse Programs',
      href: '/enrollment-v2/program',
      color: 'bg-blue-50 border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      step: 2,
      icon: FileText,
      title: 'Apply & Interview',
      description: 'Complete a quick AI-powered interview. We\'ll determine funding eligibility and recommend the best path forward.',
      cta: 'Start Application',
      href: '/enrollment-v2/apply',
      color: 'bg-purple-50 border-purple-200',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      step: 3,
      icon: DollarSign,
      title: 'Funding or Self-Pay',
      description: 'Use WIOA, SNAP, Next Level Jobs, or employer funding — or set up BNPL with $0 deposit.',
      cta: 'Explore Funding',
      href: '/enrollment-v2/funding',
      color: 'bg-green-50 border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  const benefits = [
    'No upfront cost if funding approved',
    '$0 deposit with BNPL financing',
    'Digital binder — upload docs online',
    'Same-day application review',
    'Paris AI guides your entire journey',
    'Credential earned upon completion',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1 text-sm text-blue-300 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Applications Open for August 2026
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Start Your Career<br />
            <span className="text-blue-400">in 30 Days</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Complete the enrollment process online — interview, documents, funding, and enrollment agreement. 
            No office visits required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/enrollment-v2/program"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Start Your Application <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/enrollment-v2/apply"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How Enrollment Works</h2>
          <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
            Complete everything from home in 4 simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <Link key={s.step} href={s.href} className="group block">
                <div className={`${s.color} border-2 rounded-2xl p-6 h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1`}>
                  <div className={`${s.iconBg} ${s.iconColor} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-slate-500 mb-2">Step {s.step}</div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{s.description}</p>
                  <div className="flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                    {s.cta} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Why Students Choose Elevate</h2>
          <p className="text-slate-600 text-center mb-12">Everything you need to succeed — included with enrollment.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Your career transformation begins with a single application.
          </p>
          <Link
            href="/enrollment-v2/program"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Choose Your Program <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
