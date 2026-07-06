import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle, TrendingUp, Users, Award, ArrowRight } from 'lucide-react';

const OUTCOME_STATS = [
  { value: '2,500+', label: 'Students Trained', icon: '👨‍🎓' },
  { value: '94%', label: 'Completion Rate', icon: '🎯' },
  { value: '87%', label: 'Job Placement', icon: '💼' },
  { value: '$28K', label: 'Avg. Starting Pay', icon: '💰' },
];

const TESTIMONIALS = [
  {
    quote: "I went from working at a gas station to a Medical Assistant in just 6 months. The funding covered everything.",
    name: "Maria S.",
    role: "Medical Assistant",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    program: "Healthcare",
  },
  {
    quote: "The apprenticeship program gave me real-world experience while I learned. Now I run my own shop.",
    name: "James W.",
    role: "Licensed Barber",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    program: "Beauty",
  },
  {
    quote: "WIOA paid for my entire HVAC certification. I'm making $65K now with room to grow.",
    name: "David R.",
    role: "HVAC Technician",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    program: "Trades",
  },
];

export async function HomeOutcomes() {
  return (
    <section className="py-20 bg-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-white/10 text-white text-sm font-semibold rounded-full mb-4">
            ✨ REAL RESULTS
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Transformations That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              {' '}Matter
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Real stories from real students who changed their lives through Elevate workforce training.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {OUTCOME_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300"
            >
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Success Stories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-2xl p-6 shadow-xl"
            >
              {/* Quote Icon */}
              <div className="text-brand-red-600 text-5xl font-serif mb-4">"</div>
              
              {/* Quote */}
              <p className="text-slate-700 mb-6 leading-relaxed">
                {testimonial.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-slate-500">{testimonial.role}</div>
                </div>
                <div className="ml-auto">
                  <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                    {testimonial.program}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/success-stories"
            className="inline-flex items-center gap-2 text-white hover:text-green-400 font-semibold transition-colors mb-8"
          >
            <span>Read More Success Stories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
