import Link from 'next/link';
import Image from 'next/image';
import { Phone, Calendar, ArrowRight, Clock } from 'lucide-react';

const TRUST_BADGES = [
  'DOL Registered Apprenticeship Sponsor',
  'Nationally Accredited',
  'WIOA Approved Provider',
  'Industry Leading Partners',
];

export function HomeFinalCTA() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-red-600 via-rose-500 to-pink-500" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-transparent bg-[size:32px_32px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main CTA Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 md:p-12 shadow-2xl border border-slate-700">
          {/* Badge */}
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-1 bg-brand-red-600/20 text-brand-red-400 text-sm font-semibold rounded-full mb-4">
              🎯 START YOUR TRANSFORMATION TODAY
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Change Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                {' '}Career?
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join thousands of students who have transformed their lives through Elevate workforce training. Your journey to a better career starts with one click.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {/* Primary CTA */}
            <Link
              href="/apply"
              className="group relative bg-gradient-to-r from-brand-red-600 to-rose-600 hover:from-brand-red-700 hover:to-rose-700 text-white font-bold px-8 py-5 rounded-2xl text-center transition-all duration-300 shadow-lg shadow-brand-red-600/30 hover:shadow-brand-red-600/50 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-lg">Start Application</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Secondary CTA - Schedule */}
            <Link
              href="/booking"
              className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold px-6 py-5 rounded-2xl text-center transition-all duration-300 border border-white/20 hover:border-white/30"
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>Schedule Call</span>
              </span>
            </Link>

            {/* Tertiary CTA - Call Now */}
            <Link
              href="/call-now"
              className="group bg-emerald-600/20 hover:bg-emerald-600/30 backdrop-blur-sm text-emerald-400 font-semibold px-6 py-5 rounded-2xl text-center transition-all duration-300 border border-emerald-500/30 hover:border-emerald-500/50"
            >
              <span className="flex items-center justify-center gap-2">
                <Phone className="w-5 h-5" />
                <span>Call Now</span>
              </span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="border-t border-white/10 pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRUST_BADGES.map((badge) => (
                <div key={badge} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs text-slate-400">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency/Footer Note */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>Free application • No commitment • Typical response within 24 hours</span>
          </div>
        </div>

        {/* Employer CTA (Optional Bottom Section) */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 mb-4">
            Are you an employer looking to hire trained talent?
          </p>
          <Link
            href="/employer"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold transition-colors"
          >
            <span>Partner with Elevate</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
