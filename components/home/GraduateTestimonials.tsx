'use client';

import { useState } from 'react';
import { Quote, Play, ChevronLeft, ChevronRight, Star, User } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Testimonial {
  id: string;
  name: string;
  program: string;
  graduationYear: number;
  quote: string;
  beforeStatus: string;
  afterStatus: string;
  afterSalary: string;
  imageUrl?: string;
  videoUrl?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Derek M.',
    program: 'Barbering Apprenticeship',
    graduationYear: 2023,
    quote: "I was working minimum wage at a warehouse when I heard about Elevate. Now I'm a licensed barber earning $22/hour plus tips at Great Clips. I couldn't have done it without the apprenticeship model - earning while learning made all the difference.",
    beforeStatus: 'Unemployed for 6 months',
    afterStatus: 'Lead Barber, Great Clips Castleton',
    afterSalary: '$48,000/year + tips ($15K+)',
    imageUrl: '/images/testimonials/derek.jpg',
  },
  {
    id: '2',
    name: 'Tamika J.',
    program: 'Barbering Apprenticeship',
    graduationYear: 2024,
    quote: "As a single mom, I couldn't afford traditional barber school. The apprenticeship let me earn money while I learned. My kids watched me become a professional. Best decision I ever made. Now I make more in a week than I used to make in a month.",
    beforeStatus: 'Working part-time, minimum wage',
    afterStatus: 'Barber, Sport Clips Greenfield',
    afterSalary: '$38,000/year + tips',
    imageUrl: '/images/testimonials/tamika.jpg',
  },
  {
    id: '3',
    name: 'Marcus L.',
    program: 'Barbering Apprenticeship',
    graduationYear: 2022,
    quote: "I came out of prison with nothing. Elevate gave me a chance when nobody else would. They helped me get WIOA funding and placed me at a shop that believed in second chances. Now I own my own barbershop and employ three people.",
    beforeStatus: 'Justice-involved, unemployed',
    afterStatus: 'Owner, Precision Cuts Barbershop',
    afterSalary: '$85,000/year',
    imageUrl: '/images/testimonials/marcus.jpg',
  },
  {
    id: '4',
    name: 'James R.',
    program: 'HVAC Technician',
    graduationYear: 2023,
    quote: "The hands-on training was incredible. I learned on real equipment, not mannequins. Within two weeks of graduating, I had three job offers. Now I'm working for a major commercial HVAC company making $65,000 a year with full benefits.",
    beforeStatus: 'Working retail, no prospects',
    afterStatus: 'Commercial HVAC Technician',
    afterSalary: '$65,000/year + benefits',
    imageUrl: '/images/testimonials/james.jpg',
  },
  {
    id: '5',
    name: 'Sarah K.',
    program: 'Medical Assistant',
    graduationYear: 2024,
    quote: "I always wanted to work in healthcare but couldn't afford the training. With WIOA funding covering everything, I became a certified medical assistant. Now I work at a family practice clinic I love, and I'm even going back for my LPN.",
    beforeStatus: 'Unemployed, collecting unemployment',
    afterStatus: 'Certified Medical Assistant',
    afterSalary: '$42,000/year + benefits',
    imageUrl: '/images/testimonials/sarah.jpg',
  },
  {
    id: '6',
    name: 'Michael T.',
    program: 'CDL Training',
    graduationYear: 2023,
    quote: "Six weeks. That's all it took to get my Class A CDL. Elevate helped with funding, and now I'm driving regionally for a trucking company. Home every night, $75,000 a year. My family has never been more stable.",
    beforeStatus: 'Underemployed, gig work',
    afterStatus: 'Regional CDL Driver',
    afterSalary: '$75,000/year',
    imageUrl: '/images/testimonials/michael.jpg',
  },
];

export function GraduateTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Star className="w-4 h-4" />
            Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            From Our Graduates
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real people, real transformations. See how Elevate helped these graduates 
            go from unemployed to employed.
          </p>
        </div>

        {/* Featured Testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="p-8 md:p-12 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 text-8xl text-brand-blue-100 font-serif leading-none opacity-50">
              "
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Program Badge */}
              <div className="inline-flex items-center gap-2 bg-brand-blue-100 text-brand-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                {current.program} • Class of {current.graduationYear}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-8">
                "{current.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {current.imageUrl ? (
                  <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                    <img 
                      src={current.imageUrl} 
                      alt={current.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-brand-blue-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-brand-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{current.name}</p>
                  <p className="text-gray-600">{current.afterStatus}</p>
                </div>
              </div>

              {/* Transformation Stats */}
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">Before Elevate</p>
                  <p className="font-semibold text-gray-900">{current.beforeStatus}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">After Elevate</p>
                  <p className="font-bold text-green-700">{current.afterSalary}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button 
                onClick={prevSlide}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>

              {/* Indicators */}
              <div className="flex gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentIndex 
                        ? 'w-6 bg-brand-blue-600' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={nextSlide}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </Card>
        </div>

        {/* All Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <Card 
              key={testimonial.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                testimonial.id === current.id 
                  ? 'ring-2 ring-brand-blue-500' 
                  : 'hover:border-brand-blue-200'
              }`}
              onClick={() => setCurrentIndex(TESTIMONIALS.findIndex(t => t.id === testimonial.id))}
            >
              <div className="flex items-start gap-3">
                {testimonial.imageUrl ? (
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    <img 
                      src={testimonial.imageUrl} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-brand-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.program}</p>
                </div>
              </div>
              
              <blockquote className="mt-4 text-gray-700 text-sm line-clamp-3">
                "{testimonial.quote.substring(0, 120)}..."
              </blockquote>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-semibold text-green-700">
                  {testimonial.afterSalary}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Ready to write your own success story?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4"
              onClick={() => window.location.href = '/apply'}
            >
              Apply Now
            </Button>
            <Button 
              variant="outline"
              className="border-brand-blue-600 text-brand-blue-600 hover:bg-brand-blue-50 px-8 py-4"
              onClick={() => window.location.href = '/success-stories'}
            >
              Read More Stories
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GraduateTestimonials;
