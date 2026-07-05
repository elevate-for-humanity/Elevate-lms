'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, DollarSign, GraduationCap, Scissors, Wrench, Heart, Truck } from 'lucide-react';
import { PremiumProgramCard } from './PremiumProgramCard';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface PremiumProgramsProps {
  className?: string;
}

const PROGRAMS = [
  {
    title: 'Barbering',
    description: 'Launch your career in professional barbering with paid apprenticeship and hands-on training.',
    duration: '12-18 months',
    credential: 'Indiana Barber License',
    salary: '$35K-$75K',
    href: '/programs/barber-apprenticeship',
    color: 'amber',
    icon: <Scissors className="w-8 h-8" />,
    funding: 'WIOA, Pell Grant',
    relatedCareers: ['Shop Owner', 'Stylist', 'Instructor'],
    featured: true,
  },
  {
    title: 'HVAC/R Technician',
    description: 'Earn while you learn refrigeration, heating, and cooling systems with EPA 608 certification.',
    duration: '10-14 months',
    credential: 'EPA 608 Certification',
    salary: '$42K-$85K',
    href: '/programs/hvac-technician',
    color: 'blue',
    icon: <Wrench className="w-8 h-8" />,
    funding: 'WIOA, Employer',
    relatedCareers: ['Installation Tech', 'Service Tech', 'Project Manager'],
  },
  {
    title: 'CNA + Medication Aide',
    description: 'Start your healthcare career with CNA certification and add medication administration skills.',
    duration: '4-8 months',
    credential: 'CNA + Med Aide',
    salary: '$30K-$52K',
    href: '/programs/cna-medication-aide',
    color: 'emerald',
    icon: <Heart className="w-8 h-8" />,
    funding: 'WIOA, VR, Pell',
    relatedCareers: ['LPN', 'Medical Assistant', 'Healthcare Admin'],
  },
  {
    title: 'CDL Class A',
    description: 'Get your commercial driver\'s license with paid training and job placement guarantee.',
    duration: '8-12 weeks',
    credential: 'CDL Class A',
    salary: '$50K-$90K',
    href: '/programs/cdl-training',
    color: 'purple',
    icon: <Truck className="w-8 h-8" />,
    funding: 'WIOA, Employer',
    relatedCareers: ['Owner Operator', 'Fleet Driver', 'Dispatcher'],
  },
];

export function PremiumPrograms({ className = '' }: PremiumProgramsProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-white ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-100 border border-brand-red-200 rounded-full text-brand-red-700 text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4" />
            Career Programs
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Choose Your Career Pathway
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Each program includes hands-on training, industry certifications, and job placement support.
            Most students pay $0 to $500 out of pocket through workforce funding.
          </p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {[
            { value: '8 wks', label: 'Fastest Program' },
            { value: '18 mo', label: 'Longest Program' },
            { value: '$0', label: 'Avg. Out of Pocket' },
            { value: '85%', label: 'Job Placement Rate' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-brand-red-600">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Program Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {PROGRAMS.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <PremiumProgramCard {...program} />
            </motion.div>
          ))}
        </div>

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            View All 87 Career Programs
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default PremiumPrograms;
