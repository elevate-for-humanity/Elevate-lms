'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FundingBadge } from './FundingBadge';
import PathwayDisclosure from '@/components/compliance/PathwayDisclosure';
import HeroAvatarGuide from '@/components/HeroAvatarGuide';
import { ArrowRight, Briefcase, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export type OutcomeItem = string | { title: string; description: string; image?: string };

export interface ProgramData {
  title: string;
  category: string;
  categoryHref: string;
  description: string;
  image: string;
  duration: string;
  tuition: string;
  salary: string;
  demand: string;
  fundingType?: 'funded' | 'self-pay';
  highlights: string[];
  skills: string[];
  outcomes: OutcomeItem[];
  requirements?: string[];
  relatedPrograms?: { title: string; href: string; description: string }[];
  avatarVideo?: string;
  avatarName?: string;
}

interface ProgramPageTemplateProps {
  program: ProgramData;
}

export function ProgramPageTemplate({ program }: ProgramPageTemplateProps) {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: program.category, href: program.categoryHref }, { label: program.title }]} />
        </div>
      </div>

      {/* Hero Image - Compact */}
      <section className="relative h-[35vh] min-h-[250px] lg:h-[40vh] lg:min-h-[300px] bg-slate-100">
        <Image
          src={program.image}
          alt={program.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={85}
        />
      </section>

      {/* Avatar Guide - Below Hero */}
      {program.avatarVideo && (
        <HeroAvatarGuide 
          videoSrc={program.avatarVideo}
          avatarName={program.avatarName || 'Program Guide'}
          message={`Learn about our ${program.title} program and career opportunities.`}
        />
      )}

      {/* Funding Badge */}
      {program.fundingType && (
        <section className="border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
            <FundingBadge type={program.fundingType} />
          </div>
        </section>
      )}

      {/* Badges + CTA */}
      <section className="border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-full">
                <Clock className="w-4 h-4" />
                {program.duration}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-full">
                <DollarSign className="w-4 h-4" />
                {program.tuition} Tuition
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-full">
                <TrendingUp className="w-4 h-4" />
                {program.salary} Avg. Salary
              </span>
            </div>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
            >
              Check Eligibility & Apply
            </Link>
          </div>
        </div>
      </section>

      {/* Title + Highlights */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <Link 
              href={program.categoryHref} 
              className="text-sm text-slate-500 hover:text-slate-900 mb-4 inline-block"
            >
              ← {program.category}
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
              {program.title}
            </h1>
            <p className="text-xl text-slate-500">
              {program.description}
            </p>
          </div>

          {program.highlights && program.highlights.length > 0 && (
            <div className="border-t border-slate-100 pt-12">
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-8">This program includes</p>
              <div className="grid md:grid-cols-3 gap-8">
                {program.highlights.map((highlight, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-slate-900">{highlight}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-12">
            What you'll learn
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-4">
            {(program.skills || []).map((skill, index) => (
              <div key={index} className="flex items-start gap-3 py-3 border-b border-slate-200">
                <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{skill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Detailed Steps */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-brand-green-100 text-brand-green-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Your Journey
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From application to employment - here's exactly what to expect at each step of your training journey.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Step 1: Apply Online */}
            <div className="relative bg-gradient-to-br from-brand-blue-50 to-white rounded-2xl p-8 border border-brand-blue-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-red-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                1
              </div>
              <div className="pt-4">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Apply Online</h3>
                <p className="text-slate-600 mb-6">
                  Complete our simple online application in just 10-15 minutes. We'll review your eligibility for free WIOA-funded training.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Fill out basic information and career goals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Upload ID and proof of residency</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Schedule your enrollment appointment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Get approved within 24-48 hours</span>
                  </li>
                </ul>
                <div className="mt-6 pt-6 border-t border-brand-blue-100">
                  <div className="flex items-center gap-2 text-brand-blue-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Takes about 15 minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Complete Training */}
            <div className="relative bg-gradient-to-br from-purple-50 to-white rounded-2xl p-8 border border-purple-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-red-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                2
              </div>
              <div className="pt-4">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Complete Training</h3>
                <p className="text-slate-600 mb-6">
                  Attend classes, complete hands-on practice, and earn your industry-recognized certification with expert instructors.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Attend instructor-led classroom sessions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Complete hands-on clinical practice</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Pass skills assessments and exams</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Earn your state certification</span>
                  </li>
                </ul>
                <div className="mt-6 pt-6 border-t border-purple-100">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{program.duration} program length</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Start Working */}
            <div className="relative bg-gradient-to-br from-brand-green-50 to-white rounded-2xl p-8 border border-brand-green-100 shadow-sm">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-brand-red-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
                3
              </div>
              <div className="pt-4">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Start Working</h3>
                <p className="text-slate-600 mb-6">
                  Our career services team helps you land your first job with resume support, interview prep, and employer connections.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Professional resume and cover letter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Mock interviews and coaching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">Direct introductions to hiring employers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-slate-500 flex-shrink-0">•</span>
                    <span className="text-slate-700">90-day post-employment support</span>
                  </li>
                </ul>
                <div className="mt-6 pt-6 border-t border-brand-green-100">
                  <div className="flex items-center gap-2 text-brand-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Average starting salary: {program.salary}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA after steps */}
          <div className="mt-12 text-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors shadow-lg"
            >
              Start Your Application
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Career Outcomes - Enhanced with images and details */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold px-4 py-1 rounded-full mb-4">
              Career Paths
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Where This Training Takes You
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Graduates from this program work in a variety of high-demand roles with competitive pay and growth opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(program.outcomes || []).map((outcome, index) => {
              const isObject = typeof outcome === 'object';
              const title = isObject ? outcome.title : outcome;
              const description = isObject ? outcome.description : null;
              const image = isObject && 'image' in outcome ? outcome.image : null;
              
              return (
                <div key={index} className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100">
                  {image && (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        quality={85}
                      />
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center gap-1 bg-white/90 text-slate-900 text-xs font-semibold px-3 py-1 rounded-full">
                          <Briefcase className="w-3 h-3" />
                          Career Path
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-bold text-slate-900 text-xl mb-3 group-hover:text-brand-blue-600 transition-colors">
                      {title}
                    </h3>
                    {description && (
                      <p className="text-slate-600 leading-relaxed mb-4">{description}</p>
                    )}
                    <div className="flex items-center text-brand-blue-600 font-medium text-sm">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      High Demand
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements */}
      {program.requirements && program.requirements.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-12">
              Requirements
            </h2>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-4">
              {program.requirements.map((req, index) => (
                <div key={index} className="flex items-start gap-3 py-3 border-b border-slate-100">
                  <Briefcase className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Programs */}
      {program.relatedPrograms && program.relatedPrograms.length > 0 && (
        <section className="py-16 lg:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-12">
              Looking for a different program?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {program.relatedPrograms.map((related, index) => (
                <Link
                  key={index}
                  href={related.href}
                  className="group p-6 bg-white rounded-xl hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:underline">
                    {related.title}
                  </h3>
                  <p className="text-slate-500 text-sm">{related.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            {program.fundingType === 'funded' 
              ? 'Free training for eligible Indiana residents. Check your eligibility in minutes.'
              : 'Self-pay program with payment options available.'}
          </p>
          
          {/* Pathway Disclosure above CTA */}
          <div className="mb-8">
            <PathwayDisclosure variant="compact" className="bg-gray-800 border-gray-700" />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-slate-900 font-semibold rounded-full hover:bg-slate-100 transition-colors"
            >
              Check Eligibility Requirements
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-green-600 text-white font-semibold rounded-full hover:bg-brand-green-700 transition-colors"
            >
              Apply Now
            </Link>
          </div>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
            >
              Questions? Contact Us
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
