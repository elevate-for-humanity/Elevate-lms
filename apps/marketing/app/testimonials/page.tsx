import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Quote, Star, GraduationCap, Briefcase, DollarSign, Heart } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: { absolute: `Success Stories & Testimonials | ${PLATFORM_DEFAULTS.orgName}` },
  description: 'Real stories from graduates who transformed their careers through our workforce training programs.',
  keywords: ['success stories', 'testimonials', 'graduates', 'career transformations', 'student outcomes'],
};

const TESTIMONIALS = [
  {
    name: 'Maria S.',
    program: 'Certified Nursing Assistant',
    quote: "Before Elevate, I was working minimum wage jobs. Now I'm a CNA making $18/hour with benefits. The instructors actually cared about my success.",
    image: '/images/testimonials/testimonial-medical-assistant.jpg',
    outcome: '$18/hr with benefits',
    location: 'Indianapolis, IN',
  },
  {
    name: 'James T.',
    program: 'HVAC Technician',
    quote: "The WIOA funding covered everything — tuition, books, even my certification exam. I went from unemployed to working in HVAC in just 3 months.",
    image: '/images/testimonials/student-david.jpg',
    outcome: 'Employed in 3 months',
    location: 'Carmel, IN',
  },
  {
    name: 'Destiny R.',
    program: 'Barber Apprenticeship',
    quote: "I'm earning money while I learn! My host shop pays me to train, and I'll have my barber license in 18 months with zero student debt.",
    image: '/images/barber-professional.webp',
    outcome: 'Earning while learning',
    location: 'Fishers, IN',
  },
  {
    name: 'Michael C.',
    program: 'Welding Certification',
    quote: "Welding was always something I wanted to do. Elevate helped me get certified, and now I'm making $25/hour with overtime available.",
    image: '/images/pages/welding-sparks.webp',
    outcome: '$25/hr with overtime',
    location: 'Noblesville, IN',
  },
];

const STATS = [
  { value: '500+', label: 'Graduates Placed', icon: GraduationCap },
  { value: '95%', label: 'Job Placement Rate', icon: Briefcase },
  { value: '$18+', label: 'Average Starting Wage', icon: DollarSign },
  { value: '100%', label: 'Student Satisfaction', icon: Heart },
];

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-brand-blue-800 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/graduation-ceremony.webp" alt="Graduation ceremony celebrating Elevate for Humanity student achievements" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-blue-300 font-semibold mb-4 uppercase tracking-wide text-sm">Success Stories</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Real People. Real Transformations.
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed mb-8">
              Don't just take our word for it. Hear from the students and graduates whose lives 
              were changed through our workforce training programs.
            </p>
            <Link href="/apply" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Start Your Story <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-brand-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <stat.icon className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Graduates Say</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              These are the stories that motivate us to keep doing what we do.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow">
                <Quote className="w-10 h-10 text-brand-blue-200 mb-4" />
                <p className="text-lg text-slate-700 italic mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                    <Image src={testimonial.image} alt={testimonial.name} fill className="object-cover" sizes="100vw" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                    <p className="text-brand-blue-600 text-sm">{testimonial.program}</p>
                    <p className="text-slate-500 text-xs">{testimonial.location}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                      <Star className="w-4 h-4" />
                      {testimonial.outcome}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Watch Their Stories</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              See and hear directly from graduates about their journey.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48 bg-slate-200 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-brand-blue-600 border-b-8 border-b-transparent ml-1" />
                </div>
                <span className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">2:34</span>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-900">Maria's Journey from CNA to Career</h4>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48 bg-slate-200 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-brand-blue-600 border-b-8 border-b-transparent ml-1" />
                </div>
                <span className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">3:12</span>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-900">James: From Unemployment to HVAC</h4>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
              <div className="relative h-48 bg-slate-200 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-brand-blue-600 border-b-8 border-b-transparent ml-1" />
                </div>
                <span className="absolute bottom-4 right-4 text-white text-sm bg-black/50 px-2 py-1 rounded">2:58</span>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-slate-900">Destiny: Earning While Learning</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Your Success Story Starts Here</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of Hoosiers who have transformed their careers through our programs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="inline-flex items-center bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link href="/programs" className="inline-flex items-center border-2 border-white hover:bg-white hover:text-brand-blue-900 text-white font-bold py-4 px-8 rounded-lg transition-colors">
              Browse Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
