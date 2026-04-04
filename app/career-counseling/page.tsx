import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import AICareerCounseling from '@/components/AICareerCounseling';
import { ArrowRight, Clock, DollarSign, Award, Phone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Free Career Counseling | Elevate for Humanity',
  description: 'Get free personalized career guidance. Explore career paths, identify skill gaps, and find the right training program. AI-powered counseling available 24/7.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-counseling' },
  openGraph: {
    title: 'Free Career Counseling | Elevate for Humanity',
    description: 'Get free personalized career guidance powered by AI. Explore career paths and find the right training program.',
  },
};

export default async function CareerCounselingPage() {
  const supabase = await createClient();

  // Pull live published programs from DB
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug, description, duration_weeks, sector')
    .eq('published', true)
    .eq('is_active', true)
    .neq('status', 'archived')
    .order('title')
    .limit(6);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Career Counseling' }]} />
      </div>

      {/* Hero — standard size, title below */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src="/images/pages/career-counseling-page-1.jpg"
            alt="Career counseling and guidance"
            fill sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="bg-white border-t py-10 text-center px-4">
          <p className="text-brand-blue-600 font-bold text-xs uppercase tracking-widest mb-3">Free Service</p>
          <h1 className="text-4xl md:text-5xl font-black text-black mb-4">Career Counseling</h1>
          <p className="text-black text-lg max-w-2xl mx-auto mb-8">
            Not sure which program is right for you? Our AI career counselor helps you explore options,
            understand funding, and find the path that fits your goals — available 24/7 at no cost.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#counselor"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Start Free Counseling
            </a>
            <a
              href="tel:3173143757"
              className="border-2 border-black text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <Phone className="w-4 h-4" /> Talk to a Person
            </a>
          </div>
        </div>
      </section>

      {/* Live programs from DB */}
      {programs && programs.length > 0 && (
        <section className="py-16 px-4 bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-black text-black text-center mb-3">Available Programs</h2>
            <p className="text-black text-center mb-10 max-w-xl mx-auto">
              These programs are currently enrolling. The AI counselor below can help you choose.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {programs.map((p) => (
                <Link
                  key={p.id}
                  href={`/programs/${p.slug}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow flex flex-col group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-blue-100 text-brand-blue-800">
                      {p.sector || 'Training'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-blue-600 transition-colors flex-shrink-0" />
                  </div>
                  <h3 className="font-bold text-black text-base mb-2">{p.title}</h3>
                  {p.description && (
                    <p className="text-black text-sm leading-relaxed line-clamp-2 flex-1 mb-3">
                      {p.description}
                    </p>
                  )}
                  {p.duration_weeks && (
                    <div className="flex items-center gap-1 text-xs text-black mt-auto">
                      <Clock className="w-3 h-3" />
                      {p.duration_weeks} weeks
                    </div>
                  )}
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 border-2 border-black text-black font-bold px-8 py-3 rounded-xl hover:bg-slate-50 transition-colors"
              >
                View All Programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* AI Counselor */}
      <section id="counselor" className="border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-4">
          <h2 className="text-3xl font-black text-black text-center mb-3">AI Career Counselor</h2>
          <p className="text-black text-center mb-8 max-w-xl mx-auto">
            Answer a few questions and get personalized program recommendations based on your skills,
            goals, and background. Free, private, no account required.
          </p>
        </div>
        <AICareerCounseling />
      </section>

      {/* Human fallback CTA */}
      <section className="py-14 bg-slate-900 text-center px-4">
        <h2 className="text-2xl font-black text-white mb-3">Prefer to Talk to a Person?</h2>
        <p className="text-white mb-6 max-w-xl mx-auto">
          Our enrollment advisors are available Monday–Friday, 9 AM–5 PM Eastern.
          No appointment needed.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="tel:3173143757"
            className="bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2 text-lg"
          >
            <Phone className="w-5 h-5" /> (317) 314-3757
          </a>
          <Link
            href="/contact"
            className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors text-lg"
          >
            Send a Message
          </Link>
        </div>
      </section>
    </div>
  );
}
