'use client';

/**
 * HomeFeaturedPrograms - Premium hero section highlighting HVAC, CDL, and Apprenticeships
 *
 * Features:
 * - Animated card carousel/grid
 * - Premium visual design with REAL images
 * - Dynamic animations with framer-motion
 * - Story-driven content
 */

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, DollarSign, Award } from 'lucide-react';

interface FeaturedProgram {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  color: string;
  bgColor: string;
  duration: string;
  credential: string;
  salary: string;
  cta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  features: string[];
  stats: { value: string; label: string }[];
}

const FEATURED_PROGRAMS: FeaturedProgram[] = [
  {
    slug: 'hvac-technician',
    title: 'HVAC Technician',
    subtitle: 'Master heating, cooling, and refrigeration systems. EPA 608 certification included.',
    image: '/images/pexels/hvac.webp',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    duration: '6 Weeks',
    credential: 'EPA 608 Universal',
    salary: '$35K - $65K/year',
    cta: { label: 'Start HVAC Training', href: '/programs/hvac-technician' },
    secondaryCta: { label: 'View Details', href: '/programs/hvac-technician' },
    features: [
      'Hands-on equipment training',
      'EPA 608 exam proctored on-site',
      'WIOA & Workforce Ready Grant eligible',
      'Job placement assistance',
    ],
    stats: [
      { value: '100%', label: 'Certification Rate' },
      { value: '$35K+', label: 'Starting Salary' },
      { value: '6', label: 'Week Program' },
    ],
  },
  {
    slug: 'cdl-training',
    title: 'CDL Class A Training',
    subtitle: 'Get your commercial driver\'s license and hit the road. Job placement guaranteed.',
    image: '/images/pexels/cdl.webp',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    duration: '4-8 Weeks',
    credential: 'CDL Class A',
    salary: '$50K - $80K/year',
    cta: { label: 'Start CDL Training', href: '/programs/cdl-training' },
    secondaryCta: { label: 'View Details', href: '/programs/cdl-training' },
    features: [
      'Behind-the-wheel training',
      'Pre-trip inspection mastery',
      'Job placement support',
      'Funding available for eligible students',
    ],
    stats: [
      { value: '95%', label: 'Pass Rate' },
      { value: '$50K+', label: 'Starting Salary' },
      { value: '4-8', label: 'Week Program' },
    ],
  },
  {
    slug: 'barber-apprenticeship',
    title: 'Barber Apprenticeship',
    subtitle: 'Earn while you learn. DOL-registered apprenticeship with 2,000 hours of training.',
    image: '/images/beauty/barber-hero.webp',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    duration: '12-18 Months',
    credential: 'Indiana Barber License',
    salary: '$28K - $52K/year',
    cta: { label: 'Start Apprenticeship', href: '/programs/barber-apprenticeship' },
    secondaryCta: { label: 'View Details', href: '/apprenticeships' },
    features: [
      'Get paid while training',
      '2,000 OJT hours',
      'Indiana barber license',
      'DOL registered program',
    ],
    stats: [
      { value: '100%', label: 'Licensure Rate' },
      { value: '$28K+', label: 'Starting Income' },
      { value: '2K', label: 'Training Hours' },
    ],
  },
];

export default function HomeFeaturedPrograms() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-brand-red-100 text-brand-red-600 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
            Featured Programs
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Start Your Career in Weeks
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Industry-recognized credentials, hands-on training, and job placement support.
            Many programs are funded through WIOA and Workforce Ready Grant.
          </p>
        </motion.div>

        {/* Featured Programs Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {FEATURED_PROGRAMS.map((program, index) => (
            <FeaturedProgramCard key={program.slug} program={program} index={index} />
          ))}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-slate-600 mb-4">Explore all career pathways</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              View All Programs <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/apprenticeships"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:border-slate-400 transition-colors"
            >
              Explore Apprenticeships <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/funding"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors"
            >
              Check Funding Eligibility <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturedProgramCard({ program, index }: { program: FeaturedProgram; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.6 }}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100"
    >
      {/* Header with gradient accent */}
      <div className={`h-3 ${program.bgColor.replace('50', '500')}`} />

      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={program.image}
          alt={program.title}
          fill
          className="object-cover" sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">{program.title}</h3>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {program.stats.map((stat, i) => (
            <div key={i} className="text-center p-2 bg-slate-50 rounded-xl">
              <div className="text-lg font-bold text-slate-900">{stat.value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features List */}
      <div className="px-6 pb-4">
        <ul className="space-y-2">
          {program.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Info */}
      <div className="px-6 pb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" /> {program.duration}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
          <Award className="w-3 h-3" /> {program.credential}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
          <DollarSign className="w-3 h-3" /> {program.salary}
        </span>
      </div>

      {/* CTA Buttons */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <Link
            href={program.cta.href}
            className="flex-1 text-center py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            {program.cta.label}
          </Link>
          <Link
            href={program.secondaryCta.href}
            className="flex-1 text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            {program.secondaryCta.label}
          </Link>
        </div>
      </div>

      {/* Hover Effect Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${program.bgColor.replace('50', '500')} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`} />
    </motion.div>
  );
}