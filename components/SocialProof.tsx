"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useState, useEffect } from 'react';
import {
  Star,
  Quote,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
CheckCircle, } from 'lucide-react';
import Image from 'next/image';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  program: string;
  image: string;
  quote: string;
  rating: number;
  outcome: string;
  salary?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Maria Rodriguez',
    role: 'Certified Nursing Assistant',
    program: 'Healthcare Training',
    image: '/images/pages/comp-highlights-success.jpg',
    quote:
      'This program changed my life. I went from minimum wage to a career I love with benefits and stability for my family.',
    rating: 5,
    outcome: 'Employed at Community Hospital',
    salary: '$42,000/year',
  },
  {
    id: 2,
    name: 'James Thompson',
    role: 'IT Support Specialist',
    program: 'Technology Training',
    image: '/images/pages/comp-highlights-success.jpg',
    quote:
      'The hands-on training and certification prep gave me the skills employers were looking for. I had three job offers before graduation.',
    rating: 5,
    outcome: 'Working at Tech Solutions Inc',
    salary: '$48,000/year',
  },
  {
    id: 3,
    name: 'Sarah Johnson',
    role: 'HVAC Technician',
    program: 'Skilled Trades',
    image: '/images/pages/comp-highlights-success.jpg',
    quote:
      'As a single mom, I needed training that was free and flexible. This program delivered both, and now I have a career that supports my family.',
    rating: 5,
    outcome: 'Self-employed contractor',
    salary: '$55,000/year',
  },
  {
    id: 4,
    name: 'Michael Chen',
    role: 'Medical Assistant',
    program: 'Healthcare Training',
    image: '/images/pages/comp-highlights-success.jpg',
    quote:
      'The instructors genuinely cared about my success. They helped me overcome barriers and achieve my goals.',
    rating: 5,
    outcome: 'Employed at Family Care Clinic',
    salary: '$38,000/year',
  },
  {
    id: 5,
    name: 'Lisa Williams',
    role: 'Web Developer',
    program: 'Technology Training',
    image: '/images/pages/comp-highlights-success.jpg',
    quote:
      "I never thought I could work in tech. This program proved me wrong and opened doors I didn't know existed.",
    rating: 5,
    outcome: 'Junior Developer at StartupCo',
    salary: '$52,000/year',
  },
  {
    id: 6,
    name: 'David Martinez',
    role: 'CDL Driver',
    program: 'Transportation',
    image: '/images/pages/comp-highlights-success.jpg',
    quote:
      "Free CDL training with job placement assistance? I couldn't believe it was real. Now I'm earning more than I ever have.",
    rating: 5,
    outcome: 'Driver at Logistics Plus',
    salary: '$58,000/year',
  },
];

export default function SocialProof() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [dbTestimonials, setDbTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState({ successStories: 500, avgRating: 4.9, jobPlacement: 87, completionRate: 95 });
  const supabase = createClient();

  // Load testimonials and stats from DB
  useEffect(() => {
    async function loadSocialProofData() {
      // Load testimonials from DB
      const { data: testimonialData } = await supabase
        .from('testimonials')
        .select('id, name, role, program, image_url, quote, rating, outcome, salary')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (testimonialData && testimonialData.length > 0) {
        setDbTestimonials(testimonialData.map((t: any) => ({
          ...t,
          image: t.image_url
        })));
      }

      // Load real stats from DB
      const { data: statsData } = await supabase
        .from('platform_stats')
        .select('stat_name, stat_value')
        .in('stat_name', ['success_stories', 'avg_rating', 'job_placement_rate', 'completion_rate']);
      
      if (statsData) {
        const statsMap: any = {};
        statsData.forEach((s: any) => { statsMap[s.stat_name] = s.stat_value; });
        setStats({
          successStories: statsMap.success_stories || 500,
          avgRating: statsMap.avg_rating || 4.9,
          jobPlacement: statsMap.job_placement_rate || 87,
          completionRate: statsMap.completion_rate || 95
        });
      }
    }
    loadSocialProofData();
  }, [supabase]);

  // Use DB testimonials if available, otherwise fallback to static
  const displayTestimonials = dbTestimonials.length > 0 ? dbTestimonials : testimonials;

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, displayTestimonials.length]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-zinc-900  to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-slate-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-100 rounded-full mb-3">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">500+</div>
            <div className="text-sm text-black">Success Stories</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-slate-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-blue-100 rounded-full mb-3">
              <Star className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">4.9/5</div>
            <div className="text-sm text-black">Average Rating</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-slate-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-green-100 rounded-full mb-3">
              <TrendingUp className="w-6 h-6 text-brand-green-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">87%</div>
            <div className="text-sm text-black">Job Placement</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg text-center border border-slate-200">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-black mb-1">95%</div>
            <div className="text-sm text-black">Completion Rate</div>
          </div>
        </div>

        {/* Featured Testimonial */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-12">
          <div className="grid lg:grid-cols-2">
            {/* Image Side */}
            <div className="relative h-96 lg:h-auto bg-white">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <Quote className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div className="text-6xl font-bold mb-2">
                    {currentTestimonial.rating}.0
                  </div>
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-6 h-6 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <div className="text-xl font-semibold">
                    {currentTestimonial.name}
                  </div>
                  <div className="text-teal-100">{currentTestimonial.role}</div>
                </div>
              </div>
            </div>

            {/* Content Side */}
            <div className="p-8 lg:p-12">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-3 py-2 rounded-full text-sm font-semibold mb-4">
                  {currentTestimonial.program}
                </div>
                <Quote className="w-12 h-12 text-teal-600 mb-4" />
                <p className="text-xl text-black leading-relaxed mb-6 italic">
                  &quot;{currentTestimonial.quote}&quot;
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-black font-semibold">
                    {currentTestimonial.outcome}
                  </span>
                </div>
                {currentTestimonial.salary && (
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-brand-green-600 flex-shrink-0" />
                    <span className="text-black font-semibold">
                      Starting salary: {currentTestimonial.salary}
                    </span>
                  </div>
                )}
              </div>

              {/* Navigation Dots */}
              <div className="flex items-center gap-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-teal-600'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition border border-slate-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {testimonial.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-black">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-black">
                    {testimonial.role}
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-sm text-black mb-4 line-clamp-3 italic">
                &quot;{testimonial.quote}&quot;
              </p>

              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs text-black mb-1">
                  {testimonial.program}
                </div>
                <div className="text-sm font-semibold text-teal-600">
                  {testimonial.outcome}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 pt-12 border-t border-slate-200">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-black mb-2">
              Trusted By
            </h3>
            <p className="text-black">
              Our graduates work at leading companies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {[
              'Community Hospital',
              'Tech Solutions Inc',
              'Family Care Clinic',
              'StartupCo',
              'Logistics Plus',
              'Healthcare Partners',
            ].map((company, index) => (
              <div key={index} className="text-center">
                <div className="font-bold text-black">{company}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
