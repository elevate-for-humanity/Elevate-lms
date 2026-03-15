"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { image: "/images/pages/comp-home-hero.jpg" },
  { image: "/images/pages/comp-home-hero-programs.jpg" },
  { image: "/images/pages/training-classroom.jpg" },
];

export default function RotatingHeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const pauseAndResume = () => {
    setIsPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setIsPaused(false), 8000);
  };

  const goToSlide = (index: number) => { setCurrentSlide(index); pauseAndResume(); };
  const nextSlide = () => { setCurrentSlide((prev) => (prev + 1) % slides.length); pauseAndResume(); };
  const prevSlide = () => { setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length); pauseAndResume(); };

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      {slides.map((s, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}
        >
          <Image src={s.image} alt="" fill className="object-cover object-center" priority={index === 0} quality={90} />
        </div>
      ))}

      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition flex items-center justify-center" aria-label="Previous slide">
        <ChevronLeft size={20} className="text-white" />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition flex items-center justify-center" aria-label="Next slide">
        <ChevronRight size={20} className="text-white" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button key={index} onClick={() => goToSlide(index)} className={`h-2 rounded-full transition-all ${index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"}`} aria-label={`Slide ${index + 1}`} />
        ))}
      </div>
    </section>
  );
}
