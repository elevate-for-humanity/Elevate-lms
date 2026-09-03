'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface BeautyTestimonial {
  id: number;
  name: string;
  role: string;
  program: string;
  image: string;
  quote: string;
  rating: number;
  business?: string;
  location: string;
}

const beautyTestimonials: BeautyTestimonial[] = [
  {
    id: 1,
    name: 'Destiny Williams',
    role: 'Licensed Barber',
    program: 'Barber Apprenticeship',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
    quote: 'I started this program with no experience and now I own my own barbershop. The hands-on training combined with the classroom instruction gave me everything I needed to pass my state exam on the first try.',
    rating: 5,
    business: 'Kutz & Styles Barbershop',
    location: 'Indianapolis, IN',
  },
  {
    id: 2,
    name: 'Keisha Johnson',
    role: 'Licensed Cosmetologist',
    program: 'Cosmetology Apprenticeship',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop',
    quote: 'Working while I learned meant I could support myself and my kids while getting my license. My salon owner said I was the most prepared new hire she ever had. The apprenticeship model really works.',
    rating: 5,
    business: 'Glamour Studios',
    location: 'Carmel, IN',
  },
  {
    id: 3,
    name: 'Marcus Thompson',
    role: 'Master Barber',
    program: 'Barber Apprenticeship',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    quote: 'After 10 years in corporate America, I wanted a career change. This 2,000-hour program gave me the skills and confidence to open my own shop. Best decision I ever made.',
    rating: 5,
    business: 'The Fade Factory',
    location: 'Fishers, IN',
  },
  {
    id: 4,
    name: 'Ashley Rodriguez',
    role: 'Licensed Esthetician',
    program: 'Esthetician Apprenticeship',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    quote: 'The spa environment training was incredible. I learned so much more than I expected about skincare, chemical treatments, and building a client base. Now I work at a luxury spa making great money.',
    rating: 5,
    business: 'Serenity Spa & Wellness',
    location: 'Noblesville, IN',
  },
  {
    id: 5,
    name: 'Brittany Davis',
    role: 'Nail Technician',
    program: 'Nail Technician Apprenticeship',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    quote: 'I was intimidated at first, but the mentors made learning fun. I built my client list during apprenticeship and now I have a full book of clients. My income has tripled since completing the program.',
    rating: 5,
    business: 'Luxe Nails & Spa',
    location: 'Greenfield, IN',
  },
  {
    id: 6,
    name: 'Tyrone Jackson',
    role: 'Barber Shop Owner',
    program: 'Host Shop Partner',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    quote: 'As a host shop owner, I have seen the quality of apprentices this program produces. They come ready to work, understand professionalism, and have solid foundational skills. My business has grown since joining as a partner.',
    rating: 5,
    business: "Jackson's Barbershop",
    location: 'Indianapolis, IN',
  },
];

export default function BeautyTestimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const nextSlide = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % beautyTestimonials.length);
      setIsAnimating(false);
    }, 300);
  };

  const prevSlide = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + beautyTestimonials.length) % beautyTestimonials.length);
      setIsAnimating(false);
    }, 300);
  };

  // Show 3 testimonials on large screens, 2 on medium, 1 on mobile
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setVisibleCount(3);
      else if (window.innerWidth >= 768) setVisibleCount(2);
      else setVisibleCount(1);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const testimonial = beautyTestimonials[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">
            Success Stories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4">
            From Our Apprentices to Licensed Professionals
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Hear from apprentices who transformed their lives through our DOL-registered apprenticeship programs.
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="relative">
          <div 
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${
              isAnimating ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {[0, 1, 2].map((offset) => {
              const index = (currentIndex + offset) % beautyTestimonials.length;
              const t = beautyTestimonials[index];
              
              return (
                <div
                  key={t.id}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-amber-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
                >
                  {/* Quote Icon */}
                  <Quote className="w-10 h-10 text-amber-500/30 mb-4" />
                  
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-gray-200 mb-6 leading-relaxed">
                    "{t.quote}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500">
                      <Image sizes="100vw"
                        src={t.image}
                        alt={t.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{t.name}</h4>
                      <p className="text-amber-400 text-sm">{t.role}</p>
                      <p className="text-gray-400 text-xs">{t.location}</p>
                    </div>
                  </div>
                  
                  {/* Business */}
                  {t.business && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-400 text-sm">
                        <span className="text-gray-500">Now at:</span> {t.business}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex gap-2">
              {beautyTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAnimating(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setIsAnimating(false);
                    }, 300);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-amber-500 w-6' : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/apply"
            className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all transform hover:scale-105"
          >
            Start Your Story
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
