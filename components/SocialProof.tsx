'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { Award, Quote, Star, TrendingUp, Users } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  program: string | null;
  quote: string;
  rating: number | null;
  outcome: string | null;
  salary: number | null;
}

interface PlatformStats {
  successStories: number;
  avgRating: number;
  jobPlacement: number;
  completionRate: number;
}

const EMPTY_STATS: PlatformStats = {
  successStories: 0,
  avgRating: 0,
  jobPlacement: 0,
  completionRate: 0,
};

export default function SocialProof() {
  const supabase = useMemo(() => createClient(), []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<PlatformStats>(EMPTY_STATS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSocialProofData() {
      const [testimonialRes, statsRes] = await Promise.all([
        supabase
          .from('testimonials')
          .select('id,name,role,program,quote,rating,outcome,salary')
          .eq('published', true)
          .eq('approved', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(12),
        supabase
          .from('platform_stats')
          .select('stat_name,stat_value')
          .in('stat_name', [
            'success_stories',
            'avg_rating',
            'job_placement_rate',
            'completion_rate',
          ]),
      ]);

      if (cancelled) return;

      if (!testimonialRes.error) {
        setTestimonials((testimonialRes.data ?? []) as Testimonial[]);
      }

      if (!statsRes.error && statsRes.data) {
        const values = Object.fromEntries(
          statsRes.data.map((row) => [row.stat_name, Number(row.stat_value) || 0]),
        );
        setStats({
          successStories: values.success_stories || 0,
          avgRating: values.avg_rating || 0,
          jobPlacement: values.job_placement_rate || 0,
          completionRate: values.completion_rate || 0,
        });
      }
    }

    void loadSocialProofData();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (currentIndex >= testimonials.length) setCurrentIndex(0);
  }, [currentIndex, testimonials.length]);

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const currentTestimonial = testimonials[currentIndex];
  const hasAnyStats = Object.values(stats).some((value) => value > 0);

  if (!currentTestimonial && !hasAnyStats) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {hasAnyStats ? (
          <div className="mb-16 grid gap-6 md:grid-cols-4">
            <StatCard icon={Users} value={stats.successStories > 0 ? `${stats.successStories}+` : '—'} label="Verified success stories" />
            <StatCard icon={Star} value={stats.avgRating > 0 ? `${stats.avgRating}/5` : '—'} label="Average rating" />
            <StatCard icon={TrendingUp} value={stats.jobPlacement > 0 ? `${stats.jobPlacement}%` : '—'} label="Career services outcome" />
            <StatCard icon={Award} value={stats.completionRate > 0 ? `${stats.completionRate}%` : '—'} label="Completion rate" />
          </div>
        ) : null}

        {currentTestimonial ? (
          <>
            <div className="mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
              <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                <div className="flex min-h-80 items-center justify-center bg-brand-blue-800 p-8 text-center text-white">
                  <div>
                    <Quote className="mx-auto mb-5 h-12 w-12 opacity-50" />
                    {currentTestimonial.rating ? (
                      <>
                        <div className="text-5xl font-black">{currentTestimonial.rating}.0</div>
                        <div className="mt-3 flex justify-center gap-1">
                          {Array.from({ length: Math.min(5, currentTestimonial.rating) }).map((_, index) => (
                            <Star key={index} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </>
                    ) : null}
                    <div className="mt-5 text-xl font-bold">{currentTestimonial.name}</div>
                    {currentTestimonial.role ? <div className="mt-1 text-blue-100">{currentTestimonial.role}</div> : null}
                  </div>
                </div>

                <div className="p-8 lg:p-12">
                  {currentTestimonial.program ? (
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-brand-blue-700">
                      {currentTestimonial.program}
                    </span>
                  ) : null}
                  <Quote className="mt-6 h-10 w-10 text-brand-blue-600" />
                  <p className="mt-4 text-xl italic leading-relaxed text-slate-800">
                    &quot;{currentTestimonial.quote}&quot;
                  </p>
                  {currentTestimonial.outcome ? (
                    <p className="mt-6 font-semibold text-slate-900">{currentTestimonial.outcome}</p>
                  ) : null}
                  {currentTestimonial.salary ? (
                    <p className="mt-2 text-sm text-slate-600">
                      Reported starting salary: ${Number(currentTestimonial.salary).toLocaleString('en-US')}/year
                    </p>
                  ) : null}

                  {testimonials.length > 1 ? (
                    <div className="mt-8 flex items-center gap-2" aria-label="Testimonial navigation">
                      {testimonials.map((testimonial, index) => (
                        <button
                          key={testimonial.id}
                          type="button"
                          onClick={() => {
                            setCurrentIndex(index);
                            setIsAutoPlaying(false);
                          }}
                          className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-8 bg-brand-blue-700' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                          aria-label={`View testimonial from ${testimonial.name}`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 6).map((testimonial) => (
                <article key={testimonial.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-blue-700 font-black text-white">
                      {testimonial.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{testimonial.name}</h3>
                      {testimonial.role ? <p className="text-sm text-slate-500">{testimonial.role}</p> : null}
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-4 text-sm italic leading-relaxed text-slate-700">
                    &quot;{testimonial.quote}&quot;
                  </p>
                  {testimonial.outcome ? (
                    <p className="mt-4 border-t border-slate-100 pt-4 text-sm font-semibold text-brand-blue-700">
                      {testimonial.outcome}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-brand-blue-700" />
      </div>
      <div className="mt-3 text-3xl font-black text-slate-950">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
