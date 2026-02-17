import HeroSection from '@/components/home/HeroSection';
import AudienceRouter from '@/components/home/AudienceRouter';
import ProgramOutcomes from '@/components/home/ProgramOutcomes';
import OutcomeProof from '@/components/home/OutcomeProof';
import StakeholderValue from '@/components/home/StakeholderValue';
import InfrastructureAuthority from '@/components/home/InfrastructureAuthority';
import Link from 'next/link';
import { ArrowRight, Phone, MessageSquare } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* 1. Hero — outcome-first, anxiety-neutralizing */}
      <HeroSection />

      {/* 2. Audience Router — segment and tailor */}
      <AudienceRouter />

      {/* 3. Programs with outcomes — pick a career, see the numbers */}
      <ProgramOutcomes />

      {/* 4. Outcome proof — trajectory testimonials with salary data */}
      <OutcomeProof />

      {/* 5. Stakeholder value — clear ROI for each audience */}
      <StakeholderValue />

      {/* 6. Infrastructure authority — positioning as workforce delivery system */}
      <InfrastructureAuthority />

      {/* 7. Final CTA — guided action, not passive reading */}
      <section className="py-20 sm:py-28 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-6">
              Ready to start?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Check your eligibility in 60 seconds. No commitment. No cost. Just clarity on your next step.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/wioa-eligibility"
                className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 font-bold text-lg px-10 py-5 rounded-2xl hover:bg-slate-100 transition-all shadow-2xl shadow-white/10 hover:shadow-white/20 hover:-translate-y-0.5 group"
              >
                Check Eligibility Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 border-2 border-white/20 text-white font-semibold text-lg px-10 py-5 rounded-2xl hover:bg-white/5 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                Talk to an Advisor
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-white/40">
              <a href="tel:+13175551234" className="flex items-center gap-2 hover:text-white/60 transition-colors">
                <Phone className="w-4 h-4" />
                (317) 555-1234
              </a>
              <span>&middot;</span>
              <span>Mon–Fri 8am–5pm EST</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  );
}
