import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ModernLandingHero from '@/components/landing/ModernLandingHero';
import { getSuccessStories } from '@/lib/content';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight, Award, BriefcaseBusiness, Quote, TrendingUp, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Success Stories - Real People, Real Results,
  description: 'Read approved stories from graduates who advanced through Elevate workforce training.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/success-stories' },
  openGraph: {
    title: 'Success Stories - Real People, Real Results',
    description: 'Approved graduate stories from Elevate for Humanity workforce programs.',
    url: 'https://www.elevateforhumanity.org/success-stories',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/og-default.webp', width: 1200, height: 630, alt: 'Elevate success stories' }],
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function SuccessStoriesPage() {
  const [stories, supabase] = await Promise.all([
    getSuccessStories(),
    createClient().catch(() => null),
  ]);

  let totalEnrolled = 0;
  let totalCompleted = 0;
  let totalCerts = 0;
  if (supabase) {
    const [enrolledRes, completedRes, certsRes] = await Promise.all([
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
    ]);
    totalEnrolled = enrolledRes.count ?? 0;
    totalCompleted = completedRes.count ?? 0;
    totalCerts = certsRes.count ?? 0;
  }

  const completionRate = totalEnrolled
    ? Math.round((totalCompleted / totalEnrolled) * 100)
    : null;
  const stats = [
    { label: 'Learners enrolled', value: totalEnrolled, icon: Users, color: 'text-brand-blue-700' },
    { label: 'Programs completed', value: totalCompleted, icon: TrendingUp, color: 'text-brand-red-700' },
    { label: 'Credentials issued', value: totalCerts, icon: Award, color: 'text-brand-orange-700' },
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Success Stories' }]} />
      </div>

      <ModernLandingHero
        badge="Verified learner outcomes"
        headline="Success"
        accentText="Stories"
        subheadline="Training creates momentum"
        description="Stories displayed here are published from approved Elevate records—not invented page content or placeholder testimonials."
        imageSrc="/images/pages/success-stories-hero.webp"
        imageAlt="Elevate learners building career skills"
        primaryCTA={{ text: 'Read Their Stories', href: '#stories' }}
        secondaryCTA={{ text: 'Start Your Journey', href: '/apply' }}
        features={[
          totalEnrolled ? `${totalEnrolled.toLocaleString()} learners enrolled` : 'Career-focused training',
          totalCerts ? `${totalCerts.toLocaleString()} credentials issued` : 'Industry-recognized credentials',
          completionRate !== null ? `${completionRate}% completion rate` : 'Support from enrollment to employment',
        ]}
        imageOnRight={false}
      />

      <section aria-label="Verified impact" className="border-y border-slate-200 bg-slate-50 py-10">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon aria-hidden="true" className={`h-7 w-7 ${color}`} />
              <p className="mt-4 text-3xl font-black text-slate-950">{value ? value.toLocaleString() : '—'}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="stories" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-red-700">Approved for publication</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Real progress, in their own words
            </h1>
          </div>

          {stories.length ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {stories.map((story) => (
                <article key={story.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                  <div className="grid min-h-full sm:grid-cols-[13rem_1fr]">
                    <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-brand-blue-700 via-brand-red-600 to-brand-orange-500">
                      {story.image_url ? (
                        <Image
                          src={story.image_url}
                          alt={`${story.name}, ${story.program_completed} graduate`}
                          fill
                          sizes="(min-width: 640px) 208px, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                          <span className="text-7xl font-black text-white/95">{story.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col p-6 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black text-slate-950">{story.name}</h2>
                          <p className="mt-1 font-bold text-brand-blue-700">{story.program_completed}</p>
                        </div>
                        {story.featured && (
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-900">Featured</span>
                        )}
                      </div>

                      {(story.current_job_title || story.current_employer) && (
                        <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
                          <BriefcaseBusiness aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-700" />
                          <p>
                            {story.current_job_title}
                            {story.current_job_title && story.current_employer ? ' at ' : ''}
                            {story.current_employer}
                          </p>
                        </div>
                      )}

                      {story.quote && (
                        <blockquote className="relative mt-6 pl-8 text-lg font-semibold leading-relaxed text-slate-900">
                          <Quote aria-hidden="true" className="absolute left-0 top-0 h-6 w-6 text-brand-orange-600" />
                          “{story.quote}”
                        </blockquote>
                      )}
                      <p className="mt-5 leading-relaxed text-slate-700">{story.story}</p>
                      <Link href="/programs" className="mt-7 inline-flex items-center gap-2 font-black text-brand-blue-700 hover:text-brand-red-700">
                        Explore career programs <ArrowRight aria-hidden="true" className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-3xl border border-blue-200 bg-blue-50 p-10 text-center">
              <h2 className="text-2xl font-black text-slate-950">New graduate stories are being reviewed</h2>
              <p className="mt-3 text-slate-700">
                Elevate publishes a learner story only after it has been approved in the production content system.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-r from-brand-blue-700 via-brand-red-700 to-brand-orange-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black sm:text-4xl">Ready to build your next chapter?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white">
            Explore training, funding options, and the enrollment path that fits your goal.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/apply" className="rounded-xl bg-white px-7 py-4 font-black text-brand-red-700 hover:bg-orange-50">Apply Now</Link>
            <Link href="/programs" className="rounded-xl border-2 border-white bg-transparent px-7 py-4 font-black text-white hover:bg-white/10">View Programs</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
