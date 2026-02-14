'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import AutoPlayTTS from '@/components/AutoPlayTTS';

interface Program {
  title: string;
  duration: string;
  description: string;
  href: string;
  image: string;
}

interface Stat {
  icon: string;
  title: string;
  subtitle: string;
}

interface ProgramPageLayoutProps {
  voiceoverMessage: string;
  videoSrc: string;
  programs: Program[];
  stats: Stat[];
  accentColor: 'blue' | 'orange' | 'purple' | 'green' | 'red';
  ctaText: string;
  applyLink: string;
}

const colorClasses = {
  blue: {
    badge: 'bg-brand-blue-600',
    cta: 'bg-brand-blue-600',
    ctaHover: 'hover:bg-brand-blue-700',
    ctaText: 'text-brand-blue-600',
  },
  orange: {
    badge: 'bg-orange-500',
    cta: 'bg-orange-500',
    ctaHover: 'hover:bg-orange-600',
    ctaText: 'text-orange-600',
  },
  purple: {
    badge: 'bg-purple-600',
    cta: 'bg-purple-600',
    ctaHover: 'hover:bg-purple-700',
    ctaText: 'text-purple-600',
  },
  green: {
    badge: 'bg-green-600',
    cta: 'bg-green-600',
    ctaHover: 'hover:bg-green-700',
    ctaText: 'text-green-600',
  },
  red: {
    badge: 'bg-red-600',
    cta: 'bg-red-600',
    ctaHover: 'hover:bg-red-700',
    ctaText: 'text-red-600',
  },
};

export default function ProgramPageLayout({
  voiceoverMessage,
  videoSrc,
  programs,
  stats,
  accentColor,
  ctaText,
  applyLink,
}: ProgramPageLayoutProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showContent, setShowContent] = useState(false);
  const colors = colorClasses[accentColor];

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <>
      <AutoPlayTTS text={voiceoverMessage} delay={1000} />

      {/* Hero - Clean video with just CTAs */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] flex items-end overflow-hidden bg-slate-900">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover brightness-110"
          loop
          muted
          playsInline
          autoPlay
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <div className={`flex flex-wrap gap-4 transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link 
              href={applyLink}
              className={`inline-flex items-center justify-center ${colors.cta} text-white px-8 py-4 rounded-full font-semibold ${colors.ctaHover} transition-colors text-lg`}
            >
              Apply Now
            </Link>
            <Link 
              href="/wioa-eligibility"
              className="inline-flex items-center text-white text-lg border-b-2 border-white pb-1 hover:border-brand-blue-400 hover:text-brand-blue-400 transition-all duration-300"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`grid gap-6 ${programs.length === 1 ? 'max-w-md mx-auto' : programs.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
            {programs.map((program) => (
              <Link
                key={program.title}
                href={program.href}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-slate-100"
              >
                <div className="relative h-48">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    quality={85}
                  />
                  <div className={`absolute top-3 right-3 ${colors.badge} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                    {program.duration}
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {program.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{program.description}</p>
                  <span className="text-brand-blue-600 font-semibold group-hover:underline">
                    Learn More →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className={`grid gap-6 text-center ${stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl mb-2">{stat.icon}</div>
                <h3 className="font-bold text-gray-900">{stat.title}</h3>
                <p className="text-sm text-gray-600">{stat.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`py-10 ${colors.cta}`}>
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Link
            href={applyLink}
            className={`inline-block bg-white ${colors.ctaText} px-8 py-3 font-semibold rounded-full hover:bg-opacity-90 transition-colors`}
          >
            {ctaText}
          </Link>
        </div>
      </section>
    </>
  );
}
