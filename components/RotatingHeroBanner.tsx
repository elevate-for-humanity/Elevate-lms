"use client";

import React from 'react';

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    image: "/images/pages/comp-home-hero.jpg",
    title: "From Unemployed to Employed in 4-12 Weeks",
    subtitle: "No-Cost Career Training for Eligible Participants",
    description: "CNA • HVAC • Barber • CDL • Medical Assistant • Building Tech",
    cta1: "Start Free Training",
    cta2: "Check Your Funding",
  },
  {
    image: "/images/pages/comp-home-hero-programs.jpg",
    title: "$0 Out of Pocket. Real Jobs. Real Credentials.",
    subtitle: "Government Pays 100% - You Pay Nothing",
    description: "WIOA • WRG • JRI • Apprenticeships • OJT Programs",
    cta1: "Apply Now",
    cta2: "See Programs",
  },
  {
    image: "/images/pages/training-classroom.jpg",
    title: "Earn $35K-$65K After Training",
    subtitle: "High-Demand Careers in Healthcare, Trades & Tech",
    description: "Job placement support • Industry credentials • Soft skills training",
    cta1: "Explore Careers",
    cta2: "Talk to Advisor",
  },
];

export default function RotatingHeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  const slide = slides[currentSlide];

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-slate-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {slides.map((s, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.image}
              alt={s.title}
              fill
              className="object-cover"
              priority={index === 0}
              quality={90}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
          <div className="max-w-3xl">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-green-500 px-6 py-3 text-sm font-bold text-white mb-6 animate-pulse shadow-lg">
              <span className="text-lg">💯</span>
              <span>NO-COST TRAINING FOR ELIGIBLE PARTICIPANTS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight animate-fade-in">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-2xl md:text-3xl text-brand-orange-400 font-bold mb-4">
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-lg md:text-xl text-slate-200 mb-8">
              {slide.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-brand-orange-500 rounded-full hover:bg-brand-orange-600 transition-all hover:scale-105 shadow-2xl"
              >
                {slide.cta1}
              </Link>
              <Link
                href="/funding"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-brand-blue-600 rounded-full hover:bg-brand-blue-700 transition-all hover:scale-105 shadow-2xl border-2 border-white/20"
              >
                {slide.cta2}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center text-white"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center text-white"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentSlide
                ? "w-12 bg-brand-orange-500"
                : "w-3 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 right-8 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-end justify-center pb-2">
          <div className="w-1 h-2 bg-white/70 rounded-full" />
        </div>
      </div>
    </section>
  );
}
