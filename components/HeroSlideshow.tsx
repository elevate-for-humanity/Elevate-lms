"use client";

import React from 'react';
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
interface Slide {
  image: string;
  title: string;
  text: string;
  cta?: {
    text: string;
    href: string;
  };
}
const slides: Slide[] = [
  {
    image: "/images/hero/hero-main-welcome.jpg",
    title: "Elevate for Humanity",
    text: "State-approved, federally aligned workforce training that opens doors to high-wage careers.",
    cta: {
      text: "Explore Programs",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-barber.jpg",
    title: "DOL Registered Barber Apprenticeship",
    text: "2,000-hour barber apprenticeship. Earn while you learn. WIOA, WRG, and JRI fundable. Indiana state licensure.",
    cta: {
      text: "Learn More",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-healthcare.jpg",
    title: "Healthcare Training Programs",
    text: "CNA certification through Choice Medical Institute. State-approved, workforce fundable, high-demand careers.",
    cta: {
      text: "View Healthcare Programs",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-skilled-trades.jpg",
    title: "Skilled Trades & Building Technician",
    text: "HVAC, electrical, plumbing. Hands-on training for high-wage careers in construction and maintenance.",
    cta: {
      text: "View Trades Programs",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-beauty-wellness.jpg",
    title: "Beauty & Esthetics Programs",
    text: "Nails, esthetics, and cosmetology training with experienced instructors.",
    cta: {
      text: "View Beauty Programs",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-career-services.jpg",
    title: "Career Services & Support",
    text: "Life coaching, mental health partnerships, and wraparound support to help you succeed.",
    cta: {
      text: "Learn About Support",
      href: "/support"
    }
  },
  {
    image: "/images/hero/hero-hands-on-training.jpg",
    title: "Hands-On Training",
    text: "Real-world skills training with experienced instructors in state-of-the-art facilities.",
    cta: {
      text: "See Our Facilities",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-tech-careers.jpg",
    title: "Technology Career Pathways",
    text: "IT training and technology skills for the digital economy.",
    cta: {
      text: "Explore Tech Programs",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-business.jpg",
    title: "Business & Professional Skills",
    text: "Office administration, customer service, and professional development training.",
    cta: {
      text: "View Business Programs",
      href: "/programs/barber-apprenticeship"
    }
  },
  {
    image: "/images/hero/hero-early-childhood.jpg",
    title: "Early Childhood Education",
    text: "Childcare and early education training for rewarding careers working with children.",
    cta: {
      text: "Learn More",
      href: "/programs/barber-apprenticeship"
    }
  }
];
export default function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);
  // Au voiceover on mount
  useEffect(() => {
    const audio = new Audio('/videos/voiceover.mp3');
    audio.volume = 0.7;
    audio.play().catch(err => {
      // Autoplay blocked by browser - user needs to interact first
    });
  }, []);
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  return (
    <section className="relative h-[700px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {slide.image ? (
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              quality={100}
            />
          ) : (
            
          )}
          <div className="relative h-full flex items-center">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 w-full">
              <div className="max-w-3xl">
                <h1 className="text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl text-slate-200 font-light mb-8 leading-relaxed">
                  {slide.text}
                </p>
                {slide.cta && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={slide.cta.href}
                      className="inline-flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded hover:bg-slate-100 transition-colors shadow-lg"
                    >
                      {slide.cta.text}
                    </Link>
                    <Link
                      href="/apply"
                      className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-semibold rounded border-2 border-white hover:bg-white/10 transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-all z-10"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>
    </section>
  );
}
