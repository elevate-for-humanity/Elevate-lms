'use client';
import { logger } from '@/lib/logger';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  quote: string;
  rating: number;
  image_url: string | null;
}

interface TestimonialsSectionProps {
  serviceType?: string;
  programSlug?: string;
  title?: string;
  subtitle?: string;
  bgColor?: string;
  limit?: number;
}

export default function TestimonialsSection({
  serviceType,
  programSlug,
  title = 'What Our Customers Say',
  subtitle,
  bgColor = 'bg-slate-50',
  limit = 3,
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const params = new URLSearchParams();
        if (serviceType) params.append('serviceType', serviceType);
        if (programSlug) params.append('programSlug', programSlug);
        params.append('limit', limit.toString());

        const res = await fetch(`/api/content/testimonials?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        logger.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTestimonials();
  }, [serviceType, programSlug, limit]);

  if (loading) {
    return (
      <section className={`py-20 ${bgColor}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">{title}</h2>
            {subtitle && <p className="text-xl text-slate-700">{subtitle}</p>}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
                <div className="h-20 bg-slate-200 rounded mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no testimonials
  }

  return (
    <section className={`py-20 ${bgColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-slate-900 mb-4">{title}</h2>
          {subtitle && <p className="text-xl text-slate-700">{subtitle}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-2xl p-8 shadow-sm">
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-900 mb-6">&ldquo;{testimonial.quote}&rdquo;</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {testimonial.image_url && (
                  <Image sizes="100vw"
                    src={testimonial.image_url}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  {testimonial.role && <p className="text-sm text-slate-700">{testimonial.role}</p>}
                  {testimonial.location && (
                    <p className="text-xs text-slate-700">{testimonial.location}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
