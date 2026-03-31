'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Quote, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type Testimonial = {
  id: string;
  name: string;
  program_completed: string;
  current_job_title: string | null;
  current_employer: string | null;
  quote: string;
  image_url: string | null;
  salary_before: number | null;
  salary_after: number | null;
  featured: boolean;
};

// No fallback - testimonials must come from database only

/**
 * Testimonials Page - DB-backed with fallback
 */
export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await fetch('/api/testimonials?limit=20');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTestimonials(data.testimonials || []);
      } catch (err) {
        setTestimonials([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  // Calculate stats from real data
  const avgIncrease = testimonials.length > 0
    ? Math.round(
        testimonials
          .filter(t => t.salary_before && t.salary_after)
          .reduce((acc, t) => acc + ((t.salary_after! - t.salary_before!) / t.salary_before!) * 100, 0) /
        (testimonials.filter(t => t.salary_before && t.salary_after).length || 1)
      )
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Testimonials' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-48 md:h-64 flex items-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 text-center px-4">
            Success Stories
          </h1>
        </div>
      </section>

      {/* Stats - only show if we have testimonials */}
      {testimonials.length > 0 && (
        <section className="py-8 border-b">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-brand-blue-600">{testimonials.length}</div>
                <div className="text-gray-600">Success Stories</div>
              </div>
              {avgIncrease > 0 && (
                <div>
                  <div className="text-3xl font-bold text-brand-blue-600">{avgIncrease}%</div>
                  <div className="text-gray-600">Avg Salary Increase</div>
                </div>
              )}
              <div>
                <div className="text-3xl font-bold text-brand-blue-600">Free</div>
                <div className="text-gray-600">Training Available</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Loading State */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-20 bg-white rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-brand-red-50 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-brand-red-400 mx-auto mb-4" />
            <p className="text-brand-red-700">{error}</p>
          </div>
        )}

        {/* No Testimonials State */}
        {!loading && !error && testimonials.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Quote className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Share Your Story</h2>
            <p className="text-gray-600 mb-6">
              Are you a graduate? We&apos;d love to hear about your journey. Contact us to share your success story.
            </p>
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-slate-900 font-semibold rounded-lg hover:bg-brand-blue-700 transition"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Testimonials Grid */}
        {!loading && testimonials.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Graduate Testimonials</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((story) => (
                <div key={story.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    {story.image_url ? (
                      <Image
                        src={story.image_url}
                        alt={story.name}
                        fill
                        className="object-cover"
                       sizes="100vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white">
                        <span className="text-4xl font-bold text-slate-900">
                          {story.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{story.name}</h3>
                    <p className="text-brand-blue-600 font-medium mb-3">{story.program_completed}</p>
                    
                    {story.current_job_title && story.current_employer && (
                      <p className="text-gray-600 text-sm mb-3">
                        Now: {story.current_job_title} at {story.current_employer}
                      </p>
                    )}

                    {story.quote && (
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <Quote className="w-5 h-5 text-brand-blue-500 mb-2" />
                        <p className="text-gray-700 text-sm italic line-clamp-3">
                          &ldquo;{story.quote}&rdquo;
                        </p>
                      </div>
                    )}

                    {story.salary_before && story.salary_after && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-brand-green-500" />
                        <span className="text-gray-600">
                          ${story.salary_before.toLocaleString()} → ${story.salary_after.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Your Success Story Starts Here</h2>
          <p className="text-brand-orange-100 mb-6 max-w-xl mx-auto">
            Join the graduates who have transformed their lives through 
            career training. Your story could be next.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-orange-600 font-semibold rounded-lg hover:bg-white transition"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="px-6 py-3 bg-brand-orange-400 text-slate-900 font-semibold rounded-lg hover:bg-brand-orange-300 transition"
            >
              View Programs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
