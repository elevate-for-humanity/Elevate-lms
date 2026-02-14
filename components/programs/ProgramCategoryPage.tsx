'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import HeroAvatarGuide from '@/components/HeroAvatarGuide';
import { Clock, ArrowRight, CheckCircle } from 'lucide-react';

interface Program {
  title: string;
  duration: string;
  description: string;
  href: string;
  image: string;
}

interface ProgramCategoryPageProps {
  categoryName: string;
  categorySlug: string;
  tagline: string;
  description: string;
  heroVideoSrc: string;
  heroPosterImage: string;
  accentColor: 'blue' | 'orange' | 'green' | 'purple' | 'red' | 'teal';
  programs: Program[];
  highlights?: string[];
  avatarVideoSrc?: string;
  avatarName?: string;
}

const colorClasses = {
  blue: {
    button: 'bg-brand-blue-600 hover:bg-brand-blue-700',
    badge: 'bg-brand-blue-600',
    text: 'text-brand-blue-600',
    light: 'bg-brand-blue-50',
  },
  orange: {
    button: 'bg-orange-500 hover:bg-orange-600',
    badge: 'bg-orange-500',
    text: 'text-orange-600',
    light: 'bg-orange-50',
  },
  green: {
    button: 'bg-green-600 hover:bg-green-700',
    badge: 'bg-green-600',
    text: 'text-green-600',
    light: 'bg-green-50',
  },
  purple: {
    button: 'bg-purple-600 hover:bg-purple-700',
    badge: 'bg-purple-600',
    text: 'text-purple-600',
    light: 'bg-purple-50',
  },
  red: {
    button: 'bg-red-600 hover:bg-red-700',
    badge: 'bg-red-600',
    text: 'text-red-600',
    light: 'bg-red-50',
  },
  teal: {
    button: 'bg-teal-600 hover:bg-teal-700',
    badge: 'bg-teal-600',
    text: 'text-teal-600',
    light: 'bg-teal-50',
  },
};

export default function ProgramCategoryPage({
  categoryName,
  categorySlug,
  tagline,
  description,
  heroVideoSrc,
  heroPosterImage,
  accentColor,
  programs,
  highlights,
  avatarVideoSrc,
  avatarName,
}: ProgramCategoryPageProps) {
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
    <div className="min-h-screen bg-white">
      {/* Hero Section - Compact */}
      <section className="relative w-full min-h-[45vh] sm:min-h-[50vh] flex items-center overflow-hidden bg-slate-900">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover brightness-75"
          loop
          muted
          playsInline
          autoPlay
          preload="metadata"
          poster={heroPosterImage}
        >
          <source src={heroVideoSrc} type="video/mp4" />
        </video>
        
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className={`max-w-2xl transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className={`inline-block ${colors.badge} text-white text-sm font-semibold px-4 py-1 rounded-full mb-4`}>
              {tagline}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              {categoryName}
            </h1>
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href={`/apply?program=${categorySlug}`}
                className={`inline-flex items-center justify-center ${colors.button} text-white px-8 py-4 rounded-full font-semibold transition-colors text-lg shadow-lg`}
              >
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/wioa-eligibility"
                className="inline-flex items-center text-white text-lg border-2 border-white/50 px-6 py-3 rounded-full hover:bg-white/10 transition-all"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide - Below Hero */}
      {avatarVideoSrc && (
        <HeroAvatarGuide 
          videoSrc={avatarVideoSrc}
          avatarName={avatarName || `${categoryName} Guide`}
          message={`Learn about our ${categoryName} training programs and career opportunities.`}
        />
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs />

      {/* Highlights (if provided) */}
      {highlights && highlights.length > 0 && (
        <section className={`py-8 ${colors.light}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                  <span className="text-slate-700 font-medium">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName={categoryName} programSlug={categorySlug} />

      {/* Programs Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Available Programs
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose the program that fits your career goals. All programs include job placement assistance.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <Link
                key={program.title}
                href={program.href}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100"
              >
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    quality={85}
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-blue-600 transition-colors">
                    {program.title}
                  </h3>
                  <p className="text-slate-600 mb-4 line-clamp-2">{program.description}</p>
                  <span className={`inline-flex items-center ${colors.text} font-semibold group-hover:gap-2 transition-all`}>
                    Learn More
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${colors.button.replace('hover:', '')}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Start Your {categoryName} Career?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Most students qualify for free training through WIOA funding. Apply today and start your new career path.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/apply?program=${categorySlug}`}
              className="inline-flex items-center bg-white text-slate-900 px-8 py-4 font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center text-white border-2 border-white px-8 py-4 font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              Questions? Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
