"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: number;
  quote: string;
  name: string;
  title: string;
  rating: number;
  image?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "I was unemployed for 8 months. WIOA paid for my Medical Assistant training, and I started working right after graduation. Now I'm making $42,000 a year with full benefits.",
    name: "Sarah Martinez",
    title: "Medical Assistant Graduate, 2024",
    rating: 5,
    image: "/testimonials/sarah.jpg"
  },
  {
    id: 2,
    quote: "The barber apprenticeship changed my life. I went from working retail to owning my own chair. The training was hands-on and the instructors were amazing.",
    name: "Graduate",
    title: "Barber Graduate, 2023",
    rating: 5,
    image: "/testimonials/marcus.jpg"
  },
  {
    id: 3,
    quote: "I was working minimum wage with no future. Now I'm a certified welder making $55,000 a year. The best part? It was 100% free through WIOA.",
    name: "David Rodriguez",
    title: "Welding Graduate, 2024",
    rating: 5,
    image: "/testimonials/david.jpg"
  },
  {
    id: 4,
    quote: "As a single mom, I couldn't afford college. The Medical Assistant program gave me a career path and I earned while I learned. Now I support my family.",
    name: "Jennifer Williams",
    title: "Medical Assistant Graduate, 2023",
    rating: 5,
    image: "/testimonials/jennifer.jpg"
  },
  {
    id: 5,
    quote: "The HVAC program was exactly what I needed. Great instructors, real-world training, and job placement help. I had 3 job offers before I even graduated.",
    name: "Michael Chen",
    title: "HVAC Graduate, 2024",
    rating: 5,
    image: "/testimonials/michael.jpg"
  }
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Main testimonial card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
        {/* Quote icon */}
        <div className="absolute top-8 right-8 opacity-10">
          <svg className="w-24 h-24 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>

        {/* Star rating */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-6 h-6 ${i < currentTestimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Quote */}
        <p className="text-xl md:text-2xl text-black mb-8 leading-relaxed relative z-10">
          "{currentTestimonial.quote}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full    flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {currentTestimonial.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-black text-lg">{currentTestimonial.name}</div>
            <div className="text-black">{currentTestimonial.title}</div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all button-scale"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="w-6 h-6 text-black" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all button-scale"
        aria-label="Next testimonial"
      >
        <ChevronRight className="w-6 h-6 text-black" />
      </button>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-orange-600 w-8'
                : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>

      {/* Au indicator */}
      {isAutoPlaying && (
        <div className="text-center mt-4">
          <span className="text-xs text-slate-700">Auto-playing • Click arrows to pause</span>
        </div>
      )}
    </div>
  );
}
