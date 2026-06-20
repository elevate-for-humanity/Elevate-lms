'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  video?: string;
  cta: string;
  ctaLink: string;
  badge?: string;
}

// Pexels video URLs (HD quality)
const PEXELS_VIDEOS = {
  barber: 'https://videos.pexels.com/video-files/7426300/7426300-hd_1366_576_50fps.mp4',
  beardTrim: 'https://videos.pexels.com/video-files/7697533/7697533-hd_1280_720_30fps.mp4',
  haircut: 'https://videos.pexels.com/video-files/9737935/9737935-hd_1280_720_24fps.mp4',
  salon: 'https://videos.pexels.com/video-files/7423539/7423539-hd_1080_1920_30fps.mp4',
  nail: 'https://videos.pexels.com/video-files/7754856/7754856-hd_1280_720_30fps.mp4',
  spa: 'https://videos.pexels.com/video-files/4772528/4772528-hd_720_1280_24fps.mp4',
};

// Pexels image URLs
const PEXELS_IMAGES = {
  barber: 'https://images.pexels.com/photos/7697278/pexels-photo-7697278.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  cosmetology: 'https://images.pexels.com/photos/5584459/pexels-photo-5584459.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  esthetician: 'https://images.pexels.com/photos/5583976/pexels-photo-5583976.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  nail: 'https://images.pexels.com/photos/3997391/pexels-photo-3997391.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  salon: 'https://images.pexels.com/photos/1123902/pexels-photo-1123902.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
  employer: 'https://images.pexels.com/photos/1819948/pexels-photo-1819948.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200',
};

const bannerSlides: BannerSlide[] = [
  {
    id: 1,
    title: 'Barber Apprenticeship',
    subtitle: 'DOL Registered • 2,000 Hours • Earn While You Learn',
    description: 'Complete 2,000 hours of training in a licensed barbershop + online instruction. Earn wages from day one. Graduate with your Indiana Barber License.',
    image: PEXELS_IMAGES.barber,
    video: PEXELS_VIDEOS.haircut,
    cta: 'Apply Now',
    ctaLink: '/apply/barber-apprentice',
    badge: '$4,980 Total',
  },
  {
    id: 2,
    title: 'Cosmetology Apprenticeship',
    subtitle: '2,000 Hours • Indiana License',
    description: 'Train in licensed Indiana salons with hands-on experience. Earn while you complete 2,000 hours toward your cosmetology license.',
    image: PEXELS_IMAGES.cosmetology,
    video: PEXELS_VIDEOS.beardTrim,
    cta: 'Get Started',
    ctaLink: '/apply/cosmetology-apprentice',
    badge: '$4,980 Total',
  },
  {
    id: 3,
    title: 'Esthetician Apprenticeship',
    subtitle: '2,000 Hours • Spa Training',
    description: 'Master skincare, facials, and spa treatments in a real salon environment. Your path to Indiana esthetician licensure starts here.',
    image: PEXELS_IMAGES.esthetician,
    video: PEXELS_VIDEOS.spa,
    cta: 'Learn More',
    ctaLink: '/programs/esthetician-apprenticeship',
    badge: '$4,980 Total',
  },
  {
    id: 4,
    title: 'Nail Technician Apprenticeship',
    subtitle: '2,000 Hours • Industry Certified',
    description: 'Learn nail care, manicures, pedicures, and gel applications. Build your skills, your client base, and your career in beauty.',
    image: PEXELS_IMAGES.nail,
    video: PEXELS_VIDEOS.nail,
    cta: 'Apply Today',
    ctaLink: '/apply/nail-technician-apprentice',
    badge: '$4,980 Total',
  },
  {
    id: 5,
    title: 'Employer Partners Wanted',
    subtitle: 'Host Shops Earn WOTC Tax Credits',
    description: 'Train the next generation of beauty professionals. No cost to join. Pre-screened apprentices. Compliance tracking included.',
    image: PEXELS_IMAGES.employer,
    cta: 'Become a Host Shop',
    ctaLink: '/employers/become-host-shop',
    badge: 'Free to Join',
  },
];

export default function BeautyBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
        setIsAnimating(false);
      }, 300);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused]);

  const nextSlide = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      setIsAnimating(false);
    }, 300);
  };

  const prevSlide = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
      setIsAnimating(false);
    }, 300);
  };

  const slide = bannerSlides[currentSlide];

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
      {/* Background Image with Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${isAnimating ? 'opacity-80' : 'opacity-100'}`}
      >
        <Image sizes="100vw"
          src={slide.image}
          alt={slide.title}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl">
          {/* Badge */}
          {slide.badge && (
            <span className="inline-block px-4 py-1 bg-amber-500 text-black text-sm font-semibold rounded-full mb-4 animate-pulse">
              {slide.badge}
            </span>
          )}
          
          {/* Subtitle */}
          <p className="text-amber-400 text-lg font-medium mb-2 uppercase tracking-wider">
            {slide.subtitle}
          </p>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            {slide.title}
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            {slide.description}
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={slide.ctaLink}
              className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-amber-500/30"
            >
              {slide.cta}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/programs/barber-apprenticeship"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-all"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Pause/Play Button */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="absolute bottom-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all"
        aria-label={isPaused ? 'Play' : 'Pause'}
      >
        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentSlide(index);
                setIsAnimating(false);
              }, 300);
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide
                ? 'bg-amber-500 w-8'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
        {currentSlide + 1} / {bannerSlides.length}
      </div>
    </div>
  );
}