'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, DollarSign, GraduationCap, MapPin, Truck, Heart, Scissors, Wrench, User, CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useAnimatedCounter';

interface CareerPathwaysProps {
  className?: string;
}

interface Pathway {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  startingPoint: string;
  endingPoint: string;
  salaryStart: number;
  salaryEnd: number;
  duration: string;
  funding: string;
  steps: {
    label: string;
    description: string;
  }[];
  href: string;
}

const PATHWAYS: Pathway[] = [
  {
    id: 'barber',
    title: 'Professional Barber',
    icon: <Scissors className="w-8 h-8" />,
    color: 'amber',
    startingPoint: 'Unemployed or Underemployed',
    endingPoint: 'Licensed Barber / Shop Owner',
    salaryStart: 35000,
    salaryEnd: 75000,
    duration: '12-18 months',
    funding: 'WIOA, VR, Pell Grant',
    steps: [
      { label: 'Apply', description: 'Submit your application' },
      { label: 'Learn', description: 'Theory and hands-on training' },
      { label: 'Apprentice', description: 'Earn while you learn' },
      { label: 'License', description: 'Pass the state exam' },
      { label: 'Hire', description: 'Get placed with employer' },
    ],
    href: '/programs/barber-apprenticeship',
  },
  {
    id: 'hvac',
    title: 'HVAC Technician',
    icon: <Wrench className="w-8 h-8" />,
    color: 'blue',
    startingPoint: 'No Experience',
    endingPoint: 'Certified HVAC Professional',
    salaryStart: 42000,
    salaryEnd: 85000,
    duration: '10-14 months',
    funding: 'WIOA, Trade Apprenticeship',
    steps: [
      { label: 'Apply', description: 'Submit your application' },
      { label: 'Train', description: 'Classroom and lab work' },
      { label: 'Certify', description: 'EPA 608 certification' },
      { label: 'Apprentice', description: 'On-the-job training' },
      { label: 'Hire', description: 'Start your career' },
    ],
    href: '/programs/hvac-technician',
  },
  {
    id: 'healthcare',
    title: 'Healthcare Professional',
    icon: <Heart className="w-8 h-8" />,
    color: 'emerald',
    startingPoint: 'No Healthcare Experience',
    endingPoint: 'CNA with Medication Aide',
    salaryStart: 30000,
    salaryEnd: 52000,
    duration: '4-8 months',
    funding: 'WIOA, VR, Medicaid',
    steps: [
      { label: 'Apply', description: 'Submit your application' },
      { label: 'Train', description: 'CNA certification' },
      { label: 'Certify', description: 'State board exam' },
      { label: 'Expand', description: 'Add medication aide' },
      { label: 'Hire', description: 'Healthcare placement' },
    ],
    href: '/programs/cna-medication-aide',
  },
  {
    id: 'cdl',
    title: 'CDL Truck Driver',
    icon: <Truck className="w-8 h-8" />,
    color: 'purple',
    startingPoint: "No CDL",
    endingPoint: 'Class A CDL Driver',
    salaryStart: 50000,
    salaryEnd: 90000,
    duration: '2-4 months',
    funding: 'WIOA, Employer Paid',
    steps: [
      { label: 'Apply', description: 'Submit your application' },
      { label: 'Train', description: 'CDL Class A training' },
      { label: 'Test', description: 'Pass CDL exams' },
      { label: 'Graduate', description: 'Receive your CDL' },
      { label: 'Drive', description: 'Start earning immediately' },
    ],
    href: '/programs/cdl-training',
  },
];

function PathwayCard({ pathway, index, active, onClick }: { pathway: Pathway; index: number; active: boolean; onClick: () => void }) {
  const colorClasses = {
    amber: 'bg-amber-500 text-white',
    blue: 'bg-blue-500 text-white',
    emerald: 'bg-emerald-500 text-white',
    purple: 'bg-purple-500 text-white',
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all ${
        active
          ? `${colorClasses[pathway.color as keyof typeof colorClasses]} shadow-lg`
          : 'bg-slate-100 hover:bg-slate-200'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          active ? 'bg-white/20' : 'bg-white'
        }`}>
          {pathway.icon}
        </div>
        <div className="flex-1">
          <p className={`font-bold ${active ? 'text-white' : 'text-slate-900'}`}>
            {pathway.title}
          </p>
          <p className={`text-sm ${active ? 'text-white/80' : 'text-slate-500'}`}>
            {pathway.duration}
          </p>
        </div>
        <ArrowRight className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      </div>
    </motion.button>
  );
}

function PathwayDetail({ pathway }: { pathway: Pathway }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-8"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white ${
          pathway.color === 'amber' ? 'bg-amber-500' :
          pathway.color === 'blue' ? 'bg-blue-500' :
          pathway.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
        }`}>
          {pathway.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-900">{pathway.title}</h3>
          <p className="text-slate-500">{pathway.duration}</p>
        </div>
      </div>

      {/* Journey */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <User className="w-4 h-4" />
          <span>{pathway.startingPoint}</span>
          <ArrowRight className="w-4 h-4" />
          <span className="font-semibold text-slate-900">{pathway.endingPoint}</span>
        </div>

        {/* Steps */}
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-4">
            {pathway.steps.map((step, index) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center gap-4"
              >
                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                  pathway.color === 'amber' ? 'bg-amber-500' :
                  pathway.color === 'blue' ? 'bg-blue-500' :
                  pathway.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{step.label}</p>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
          <p className="text-xs text-slate-500">Starting Salary</p>
          <p className="text-lg font-bold text-slate-900">${(pathway.salaryStart / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto mb-2 text-brand-red-500" />
          <p className="text-xs text-slate-500">Top Salary</p>
          <p className="text-lg font-bold text-slate-900">${(pathway.salaryEnd / 1000).toFixed(0)}K</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <GraduationCap className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className="text-xs text-slate-500">Duration</p>
          <p className="text-lg font-bold text-slate-900">{pathway.duration.split('-')[0]}</p>
        </div>
      </div>

      {/* Funding */}
      <div className="bg-emerald-50 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 text-emerald-700 mb-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Funding Available</span>
        </div>
        <p className="text-sm text-emerald-600">{pathway.funding}</p>
      </div>

      {/* CTA */}
                <Link
        href={pathway.href}
        className={`block w-full text-center px-6 py-4 font-bold rounded-xl transition-colors ${
          pathway.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600 text-white' :
          pathway.color === 'blue' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
          pathway.color === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
        }`}
      >
        Start Your {pathway.title} Journey
        <ArrowRight className="w-5 h-5 inline ml-2" />
                </Link>
    </motion.div>
  );
}

export function CareerPathways({ className = '' }: CareerPathwaysProps) {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [activePathway, setActivePathway] = useState(PATHWAYS[0]);

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 bg-slate-50 ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-100 border border-brand-red-200 rounded-full text-brand-red-700 text-sm font-medium mb-4">
            <Briefcase className="w-4 h-4" />
            Career Pathways
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Your Journey from Unemployed to Employed
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Choose your career path and see exactly how Elevate guides you from where you are today to where you want to be.
          </p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Pathway Selector */}
          <div className="space-y-3">
            {PATHWAYS.map((pathway, index) => (
              <PathwayCard
                key={pathway.id}
                pathway={pathway}
                index={index}
                active={activePathway.id === pathway.id}
                onClick={() => setActivePathway(pathway)}
              />
            ))}
          </div>

          {/* Pathway Detail */}
          <div className="lg:col-span-2">
            <PathwayDetail pathway={activePathway} />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
                    <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-brand-red-600 font-semibold hover:text-brand-red-700"
          >
            View All Career Pathways
            <ArrowRight className="w-5 h-5" />
                    </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default CareerPathways;
