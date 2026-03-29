"use client";

import React from 'react';
import Image from 'next/image';
import type { Program } from '@/app/data/programs';
import CanonicalVideo from '@/components/video/CanonicalVideo';

export function ProgramHero({ program }: { program: Program }) {

  const isBarberProgram = program.slug === 'barber-apprenticeship';
  const isHVACProgram = program.slug === 'hvac-technician';
  const isCDLProgram = program.slug === 'cdl';
  const isCNAProgram = program.slug === 'cna';
  const isWorkforceProgram = program.slug === 'workforce-readiness';
  const isMedicalAssistant = program.slug === 'medical-assistant';
  const hasVideo =
    isBarberProgram || isHVACProgram || isCDLProgram || isCNAProgram ||
    isWorkforceProgram || isMedicalAssistant;

  const getIcon = () => {
    if (program.slug.includes('barber')) return '✂️';
    if (program.slug.includes('cna') || program.slug.includes('health')) return '🏥';
    if (program.slug.includes('medical')) return '🩺';
    if (program.slug.includes('hvac')) return '🛠️';
    if (program.slug.includes('cdl')) return '🚚';
    if (program.slug.includes('tax') || program.slug.includes('business')) return '💼';
    if (program.slug.includes('beauty') || program.slug.includes('esthetician')) return '💅';
    if (program.slug.includes('building')) return '🏗️';
    return '📚';
  };

  return (
    <>
      <section className="relative bg-transparent">
        <div className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] overflow-hidden">
          {hasVideo ? (
            <CanonicalVideo
              src="/videos/hero-home.mp4"
              poster={program.heroImage || '/images/pages/training-cohort.jpg'}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Image
              src={program.heroImage}
              alt={program.heroImageAlt}
              fill
              sizes="100vw"
              quality={70}
              className="object-cover"
              priority
            />
          )}

          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 sm:px-6 pb-8 sm:pb-12">
              <div className="max-w-4xl">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <span className="text-3xl sm:text-4xl md:text-5xl">{getIcon()}</span>
                  <p className="text-xs sm:text-sm uppercase tracking-wide text-brand-orange-400 font-semibold">
                    Elevate Workforce Pathway
                  </p>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">
                  {program.name}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-slate-200 max-w-3xl">
                  {program.heroSubtitle}
                </p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                  <a
                    href={`/apply?program=${program.slug}`}
                    className="inline-flex items-center justify-center bg-brand-red-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-brand-red-700 transition shadow-lg text-center whitespace-nowrap text-sm sm:text-base"
                  >
                    Apply Now
                  </a>
                  {program.ctaSecondary && (
                    <a
                      href={program.ctaSecondary.href}
                      className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold hover:bg-white/20 transition border-2 border-white/30 text-center whitespace-nowrap text-sm sm:text-base"
                    >
                      {program.ctaSecondary.label}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-sm text-black mb-1">Duration</div>
                <div className="text-3xl font-bold text-brand-orange-500">{program.duration}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-black mb-1">Cost</div>
                <div className="text-3xl font-bold text-brand-orange-500">$0</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-black mb-1">Format</div>
                <div className="text-lg font-bold text-brand-orange-500">{program.delivery}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-black mb-1">Credential</div>
                <div className="text-lg font-bold text-brand-orange-500">
                  {program.credential.split(':')[0] || 'Certificate'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
