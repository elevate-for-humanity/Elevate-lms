'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, TrendingUp, ArrowRight, Briefcase } from 'lucide-react';
import PathwayDisclosure from '@/components/compliance/PathwayDisclosure';
import CanonicalVideo from '@/components/video/CanonicalVideo';

export interface VisualProgramData {
  title: string;
  category: string;
  categoryHref: string;
  tagline: string;
  heroImage: string;
  heroVideo?: string;
  duration: string;
  salary: string;
  demand: string;
  fundingType: 'funded' | 'self-pay';
  // Visual sections with images
  sections: {
    title: string;
    image: string;
    points: string[];
  }[];
  // Career outcomes as visual cards
  careers: {
    title: string;
    salary: string;
    icon?: string;
  }[];
  // Simple requirements
  requirements: string[];
}

interface Props {
  program: VisualProgramData;
}

export function ProgramPageVisual({ program }: Props) {

  return (
    <div className="min-h-screen bg-white">
      {/* HERO - Full width, visual-first */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end">
        {program.heroVideo ? (
          <CanonicalVideo
            src={program.heroVideo}
            poster={program.heroImage || '/images/og-default.jpg'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={program.heroImage}
            alt={program.title}
            fill
            className="object-cover"
            priority
            quality={90}
          />
        )}
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12">
          <Link 
            href={program.categoryHref}
            className="inline-flex items-center text-slate-600 text-sm mb-4 hover:text-white"
          >
            ← {program.category}
          </Link>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
            {program.title}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl">
            {program.tagline}
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-white font-medium">{program.duration}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <DollarSign className="w-5 h-5 text-brand-green-400" />
              <span className="text-white font-medium">{program.salary} Avg Salary</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <TrendingUp className="w-5 h-5 text-brand-blue-400" />
              <span className="text-white font-medium">{program.demand} Demand</span>
            </div>
            {program.fundingType === 'funded' && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full border border-brand-green-400/50">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <span className="text-brand-green-300 font-medium">Free for Eligible</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center bg-brand-red-600 hover:bg-brand-red-700 text-white px-8 py-4 rounded-xl font-bold text-base transition"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/wioa-eligibility"
              className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* VISUAL SECTIONS - Alternating image/content */}
      {program.sections.map((section, index) => (
        <section 
          key={index} 
          className={`py-16 lg:py-24 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              {/* Image */}
              <div className={`relative h-[400px] rounded-2xl overflow-hidden shadow-xl ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <Image
                  src={section.image}
                  alt={section.title}
                  fill
                  className="object-cover"
                  quality={85}
                />
              </div>
              
              {/* Content */}
              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.points.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-slate-500 flex-shrink-0">•</span>
                      </div>
                      <span className="text-slate-700 text-lg">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CAREER OUTCOMES - Visual cards */}
      <section className="py-16 lg:py-24 bg-white border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Career Opportunities
            </h2>
            <p className="text-slate-500 text-lg">
              Jobs you can get after completing this program
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {program.careers.map((career, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 border border-slate-700 hover:border-brand-blue-500 transition"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-brand-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{career.title}</h3>
                <p className="text-brand-green-400 font-semibold">{career.salary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REQUIREMENTS - Simple visual */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Requirements
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {program.requirements.map((req, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 bg-slate-50 rounded-xl p-4"
              >
                <div className="w-8 h-8 bg-brand-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                </div>
                <span className="text-slate-700 font-medium">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Visual steps */}
      <section className="py-16 lg:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Apply Online</h3>
              <p className="text-slate-600">Quick application takes 5 minutes</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Complete Training</h3>
              <p className="text-slate-600">Hands-on learning with certification</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-black text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get Hired</h3>
              <p className="text-slate-600">Job placement assistance included</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Ready to Start?
          </h2>
          <p className="text-brand-blue-100 text-lg mb-6">
            {program.fundingType === 'funded' 
              ? 'Free training for eligible Indiana residents through WIOA funding.'
              : 'Flexible payment options available.'}
          </p>
          
          <PathwayDisclosure variant="compact" className="bg-brand-blue-700 border-brand-blue-500 mb-8 max-w-2xl mx-auto" />
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center border-2 border-white/40 hover:border-white text-white px-8 py-4 rounded-xl font-bold text-base transition"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition"
            >
              Talk to Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
