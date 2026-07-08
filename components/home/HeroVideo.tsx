'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Play, Pause, Volume2, VolumeX, Maximize, ArrowRight, Calendar, CheckCircle } from 'lucide-react';

interface HeroVideoProps {
  className?: string;
}

const HERO_SLIDES = [
  {
    id: 1,
    headline: 'From Unemployed to Employed',
    subheadline: 'Earn while you learn with paid apprenticeships in healthcare, skilled trades, and beauty industries. Funding may cover your entire program.',
    cta: { text: 'Apply Now', href: '/apply' },
    background: 'from-slate-900 via-slate-800 to-brand-red-900/30',
  },
  {
    id: 2,
    headline: 'Your Career Transformation Starts Here',
    subheadline: 'Start your journey today. Our programs are funded, our credentials are recognized, and our employer partners are ready to hire.',
    cta: { text: 'Explore Programs', href: '/programs' },
    background: 'from-brand-red-900/50 via-slate-900 to-slate-800',
  },
  {
    id: 3,
    headline: 'Government-Backed, Employer-Approved',
    subheadline: 'DOL-registered apprenticeship sponsor with 40+ employer partners. Your credential is recognized. Your career is guaranteed.',
    cta: { text: 'Schedule Free Consultation', href: '/schedule-consultation' },
    background: 'from-slate-900 via-blue-900/30 to-slate-800',
  },
];

export function HeroVideo({ className = '' }: HeroVideoProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate slides every 8 seconds
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }, 8000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      }, 8000);
    }
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section 
      className={`relative min-h-[90vh] flex items-center overflow-hidden bg-slate-900 ${className}`}
      role="banner"
      aria-label="Hero section with career transformation message"
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.background}`} />
        
        {/* Animated Geometric Shapes */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-red-600/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-blue-600/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 4 }}
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600/20 border border-brand-red-600/40 rounded-full text-brand-red-400 text-sm font-medium"
              role="status"
            >
              <span className="w-2 h-2 bg-brand-red-500 rounded-full animate-pulse" aria-hidden="true" />
              DOL Registered Apprenticeship Sponsor
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ delay: 0.4 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
            >
              {slide.headline.split(' to ').map((part, i) => (
                i === 1 ? (
                  <span key={i} className="block text-brand-red-500">{part}</span>
                ) : (
                  <span key={i}>{part}</span>
                )
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-slate-300 max-w-2xl mx-auto"
            >
              {slide.subheadline}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href={slide.cta.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors shadow-lg shadow-brand-red-600/30"
                aria-label={slide.cta.text}
              >
                {slide.cta.text}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                href="/eligibility"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 transition-colors"
                aria-label="Check eligibility"
              >
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                Check Eligibility
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ delay: 1 }}
              className="flex flex-wrap justify-center gap-6 pt-8"
              role="list"
              aria-label="Key statistics"
            >
              {[
                { value: '94%', label: 'Completion' },
                { value: '40+', label: 'Employers' },
                { value: '98%', label: 'Pass Rate' },
                { value: '100%', label: 'Funding Help' },
              ].map((stat) => (
                <div key={stat.label} className="text-center" role="listitem">
                  <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Video Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
        >
          {/* Slide Indicators */}
          <div className="flex gap-2" role="tablist" aria-label="Slide navigation">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentSlide ? 'bg-brand-red-600 w-8' : 'bg-white/30 hover:bg-white/50'
                }`}
                role="tab"
                aria-selected={index === currentSlide}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-white/10 backdrop-blur rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 right-8 hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/50 text-sm"
          >
            Scroll to explore
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default HeroVideo;
