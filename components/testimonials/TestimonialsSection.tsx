'use client';

import { useEffect, useState } from 'react';

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
  program: string | null;
};

/**
 * DB-backed testimonials section.
 * Strict rendering: Returns null if no testimonials.
 */
export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
      try {
        const res = await fetch('/api/testimonials?featured=true&limit=5');
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTestimonials();
  }, []);

  // Strict rendering: no testimonials = no section
  if (loading) {
    return (
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
            <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
              <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-8"></div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const current = testimonials[currentIndex];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">What Our Graduates Say</h2>
        </div>
        
        <div className="relative">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12">
            <svg className="w-12 h-12 text-brand-blue-600/20 mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
            <p className="text-2xl md:text-3xl font-medium text-slate-800 mb-8 leading-relaxed">
              {current.quote}
            </p>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-white font-bold text-xl">
                {current.name[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{current.name}</p>
                <p className="text-slate-500">{current.role}</p>
              </div>
            </div>
          </div>
          
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentIndex === i ? 'bg-brand-blue-600 w-8' : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
