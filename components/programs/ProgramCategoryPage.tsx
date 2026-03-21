'use client';

import Link from 'next/link';
import Image from 'next/image';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import HeroAvatarGuide from '@/components/HeroAvatarGuide';
import { Clock, ArrowRight } from 'lucide-react';

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
    button: 'bg-brand-orange-500 hover:bg-brand-orange-600',
    badge: 'bg-brand-orange-500',
    text: 'text-brand-orange-600',
    light: 'bg-brand-orange-50',
  },
  green: {
    button: 'bg-brand-green-600 hover:bg-brand-green-700',
    badge: 'bg-brand-green-600',
    text: 'text-brand-green-600',
    light: 'bg-brand-green-50',
  },
  purple: {
    button: 'bg-purple-600 hover:bg-purple-700',
    badge: 'bg-purple-600',
    text: 'text-purple-600',
    light: 'bg-purple-50',
  },
  red: {
    button: 'bg-brand-red-600 hover:bg-brand-red-700',
    badge: 'bg-brand-red-600',
    text: 'text-brand-red-600',
    light: 'bg-brand-red-50',
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
  const colors = colorClasses[accentColor];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — video frame only, no text overlay */}
      <section className="relative w-full h-[45vh] sm:h-[50vh] min-h-[280px] overflow-hidden">
        <CanonicalVideo
          src={heroVideoSrc}
          poster={heroPosterImage}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </section>

      {/* Below-hero identity and CTAs */}
      <section className="border-b border-slate-100 py-10 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className={`inline-block ${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide`}>
            {tagline}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            {categoryName}
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-2xl">
            {description}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/apply?program=${categorySlug}`}
              className={`inline-flex items-center gap-2 ${colors.button} text-white px-8 py-3.5 rounded-lg font-bold transition-colors`}
            >
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/wioa-eligibility"
              className="border border-slate-300 text-slate-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition-colors"
            >
              Check Eligibility
            </Link>
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
                  <span className="text-slate-500 flex-shrink-0">•</span>
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
      <section className="py-16">
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
