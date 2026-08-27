/**
 * PremiumTestingCenter
 * 
 * Complete premium testing center experience with:
 * - Cinematic hero video
 * - Provider cards with logos
 * - Interactive exam finder
 * - Testing process timeline
 * - Testing center gallery
 * - What to expect checklist
 * - Employer partnerships
 * - Exam preparation
 * - Trust indicators
 * - AI assistant
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Import pricing from the centralized pricing engine
import { CERTIPORT_FEES } from '@/lib/testing/providers/certiport-pricing';
import { NRF_RISEUP_PRICING } from '@/lib/testing/providers/nrf-riseup';
import { WORKKEYS_PRICING } from '@/lib/testing/providers/workkeys-pricing';
import { CAREERSAFE_PRICING } from '@/lib/testing/providers/careersafe-pricing';
import { calculatePrice } from '@/lib/testing/pricing-engine';
import { PricingConfigurator } from './PricingConfigurator';

// Provider hero images - consolidated to match dynamic provider pages
const PROVIDER_HERO_IMAGES: Record<string, string> = {
  nha: '/images/pages/medical-assistant.webp',
  certiport: '/images/pages/programs-it-hero.webp',
  workkeys: '/images/pages/career-services-page-4.webp',
  esco: '/images/pages/hvac-technician.webp',
  nrf: '/images/pages/apply-employer-hero.webp',
  careersafe: '/images/pages/apprenticeships-hero.webp',
  ase: '/images/pages/hvac-technician.webp',
};

// Provider data - prices pulled from centralized pricing engine
const PROVIDERS = [
  {
    id: 'nha',
    name: 'NHA',
    fullName: 'National Healthcareer Association',
    logo: '/images/heroes/hero-homepage.webp',
    heroImage: PROVIDER_HERO_IMAGES.nha,
    certifications: [
      { name: 'CCMA - Certified Clinical Medical Assistant', career: 'Medical Assistant', salary: '$35,000-$45,000/yr' },
      { name: 'CPT - Certified Phlebotomy Technician', career: 'Phlebotomist', salary: '$32,000-$40,000/yr' },
      { name: 'CET - Certified EKG Technician', career: 'EKG Technician', salary: '$35,000-$48,000/yr' },
      { name: 'ExCPT - Certified Pharmacy Technician', career: 'Pharmacy Tech', salary: '$33,000-$45,000/yr' },
    ],
    accent: 'from-blue-600 to-cyan-600',
    examFee: '$117 - $180', // NHA pricing varies by exam
    color: 'blue',
  },
  {
    id: 'certiport',
    name: 'Certiport',
    fullName: 'Certiport (Pearson VUE)',
    logo: '/images/heroes/hero-homepage.webp',
    heroImage: PROVIDER_HERO_IMAGES.certiport,
    certifications: [
      { name: 'Microsoft Office Specialist (MOS)', career: 'Office Administration', salary: '$35,000-$50,000/yr' },
      { name: 'Adobe Certified Professional', career: 'Graphic Design', salary: '$40,000-$60,000/yr' },
      { name: 'QuickBooks Certified', career: 'Bookkeeping', salary: '$38,000-$55,000/yr' },
      { name: 'IT Specialist', career: 'IT Support', salary: '$40,000-$60,000/yr' },
    ],
    accent: 'from-red-600 to-orange-600',
    examFee: CERTIPORT_FEES?.[0]?.amount && CERTIPORT_FEES?.[2]?.amount 
      ? `$${CERTIPORT_FEES[0].amount} - $${CERTIPORT_FEES[2].amount}` 
      : '$80 - $200', // Dynamic pricing fallback
    color: 'red',
  },
  {
    id: 'workkeys',
    name: 'ACT WorkKeys',
    fullName: 'ACT WorkKeys / NCRC',
    logo: '/images/heroes/hero-homepage.webp',
    heroImage: PROVIDER_HERO_IMAGES.workkeys,
    certifications: [
      { name: 'Bronze Certificate', career: 'Foundation Level', salary: 'Entry Positions' },
      { name: 'Silver Certificate', career: 'Skilled Positions', salary: '+15-20% Earnings' },
      { name: 'Gold Certificate', career: 'Advanced Positions', salary: '+25-30% Earnings' },
      { name: 'Platinum Certificate', career: 'Highly Skilled', salary: '+35-40% Earnings' },
    ],
    accent: 'from-emerald-600 to-teal-600',
    examFee: WORKKEYS_PRICING?.individual?.price && WORKKEYS_PRICING?.ncrc?.price 
      ? `$${WORKKEYS_PRICING.individual.price} - $${WORKKEYS_PRICING.ncrc.price}` 
      : '$55 - $100',
    color: 'green',
  },
  {
    id: 'esco',
    name: 'EPA 608',
    fullName: 'EPA Section 608 Technician Certification',
    logo: '/images/heroes/hero-homepage.webp',
    heroImage: PROVIDER_HERO_IMAGES.esco,
    certifications: [
      { name: 'Universal Certification', career: 'HVAC/R Technician', salary: '$45,000-$70,000/yr' },
      { name: 'Type I (Small Appliances)', career: 'Maintenance', salary: '$35,000-$50,000/yr' },
      { name: 'Type II (High Pressure)', career: 'HVAC Helper', salary: '$38,000-$52,000/yr' },
      { name: 'Type III (Low Pressure)', career: 'Refrigeration', salary: '$40,000-$55,000/yr' },
    ],
    accent: 'from-amber-600 to-orange-600',
    examFee: '$70 - $120', // EPA 608 pricing varies by type
    color: 'amber',
  },
  {
    id: 'nrf',
    name: 'NRF',
    fullName: 'NRF Foundation / RISE UP',
    logo: '/images/heroes/hero-homepage.webp',
    heroImage: PROVIDER_HERO_IMAGES.nrf,
    certifications: [
      { name: 'Customer Service', career: 'Retail Associate', salary: '$28,000-$38,000/yr' },
      { name: 'Sales Associate', career: 'Sales Professional', salary: '$30,000-$45,000/yr' },
      { name: 'Retail Management', career: 'Store Manager', salary: '$40,000-$60,000/yr' },
      { name: 'Loss Prevention', career: 'LP Specialist', salary: '$35,000-$50,000/yr' },
    ],
    accent: 'from-purple-600 to-pink-600',
    examFee: NRF_RISEUP_PRICING?.retailFundamentals?.price && NRF_RISEUP_PRICING?.customerServiceSales?.price
      ? `$${NRF_RISEUP_PRICING.retailFundamentals.price} - $${NRF_RISEUP_PRICING.customerServiceSales.price}` 
      : '$45 - $90',
    color: 'purple',
  },
  {
    id: 'careersafe',
    name: 'CareerSafe',
    fullName: 'CareerSafe OSHA Safety',
    logo: '/images/heroes/hero-homepage.webp',
    heroImage: PROVIDER_HERO_IMAGES.careersafe,
    certifications: [
      { name: 'OSHA 10-Hour General Industry', career: 'Safety Entry', salary: '$35,000-$50,000/yr' },
      { name: 'OSHA 30-Hour Construction', career: 'Safety Professional', salary: '$50,000-$75,000/yr' },
      { name: 'First Aid/CPR/AED', career: 'All Industries', salary: 'Required Add-on' },
      { name: 'Forklift Certification', career: 'Warehouse/Logistics', salary: '$38,000-$52,000/yr' },
    ],
    accent: 'from-orange-600 to-red-600',
    examFee: CAREERSAFE_PRICING ? `$${CAREERSAFE_PRICING.osha10.price} - $${CAREERSAFE_PRICING.osha30.price}` : '$40 - $80',
    color: 'orange',
  },
  {
    id: 'ase',
    name: 'ASE',
    fullName: 'ASE Certification (NISE)',
    logo: '/images/partners/ase-logo.png',
    heroImage: '/images/pages/hvac-technician.webp',
    certifications: [
      { name: 'A1 - Engine Repair', career: 'Auto Technician', salary: '$35,000-$55,000/yr' },
      { name: 'A4 - Suspension & Steering', career: 'Auto Technician', salary: '$35,000-$55,000/yr' },
      { name: 'A5 - Brakes', career: 'Brake Specialist', salary: '$32,000-$50,000/yr' },
      { name: 'A6 - Electrical/Electronic', career: 'Auto Electrician', salary: '$38,000-$58,000/yr' },
      { name: 'A8 - Engine Performance', career: 'Diagnostic Technician', salary: '$40,000-$60,000/yr' },
    ],
    accent: 'from-slate-600 to-blue-600',
    examFee: '$49',
    color: 'slate',
  },
];

// Career paths for exam finder
const CAREER_PATHS = [
  { 
    name: 'Healthcare', 
    icon: '🏥',
    careers: ['Medical Assistant', 'Phlebotomist', 'EKG Tech', 'Pharmacy Tech', 'Nursing'],
    providers: ['nha'],
  },
  { 
    name: 'Skilled Trades', 
    icon: '🔧',
    careers: ['HVAC', 'Electrician', 'Plumber', 'Welder', 'Construction', 'Automotive'],
    providers: ['esco', 'ase'],
  },
  { 
    name: 'Business & Technology', 
    icon: '💼',
    careers: ['Office Admin', 'Bookkeeping', 'IT Support', 'Graphic Design'],
    providers: ['certiport'],
  },
  { 
    name: 'Retail & Customer Service', 
    icon: '🛒',
    careers: ['Sales Associate', 'Customer Service', 'Retail Management'],
    providers: ['nrf'],
  },
  { 
    name: 'Career Readiness', 
    icon: '📋',
    careers: ['Any Industry', 'Job Applications', 'Career Advancement'],
    providers: ['workkeys'],
  },
  { 
    name: 'Safety & Compliance', 
    icon: '⚠️',
    careers: ['Warehouse', 'Manufacturing', 'Construction', 'OSHA'],
    providers: ['careersafe'],
  },
];

// Icons
const ICONS = {
  check: '/images/icons/check-circle.svg',
  checkWhite: '/images/icons/check-white.svg',
  calendar: '/images/icons/calendar.svg',
  clock: '/images/icons/clock.svg',
  dollar: '/images/icons/dollar.svg',
  shield: '/images/icons/shield.svg',
  users: '/images/icons/users.svg',
  book: '/images/icons/book.svg',
  phone: '/images/icons/phone.svg',
  location: '/images/icons/location.svg',
  certificate: '/images/icons/certificate.svg',
};

// Interactive Exam Finder
function ExamFinder() {
  const [step, setStep] = useState<'career' | 'result'>('career');
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  
  const findProviders = (career: string) => {
    const path = CAREER_PATHS.find(p => 
      p.name.toLowerCase() === career.toLowerCase() || 
      p.careers.some(c => c.toLowerCase().includes(career.toLowerCase()))
    );
    return path ? PROVIDERS.filter(p => path.providers.includes(p.id)) : [];
  };

  const handleSelectCareer = (careerPath: typeof CAREER_PATHS[0]) => {
    setSelectedCareer(careerPath.name);
    setStep('result');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-2">Find Your Exam</h3>
      <p className="text-slate-600 mb-6">Answer a few questions to find the right certification</p>
      
      {step === 'career' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CAREER_PATHS.map((path) => (
            <button
              key={path.name}
              onClick={() => handleSelectCareer(path)}
              className="p-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-center transition-colors"
            >
              <span className="text-3xl mb-2 block">{path.icon}</span>
              <span className="font-semibold text-slate-900">{path.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button
            onClick={() => setStep('career')}
            className="mb-4 text-sm text-brand-red-600 hover:text-brand-red-700 font-medium"
          >
            ← Back to career selection
          </button>
          
          <p className="text-lg font-semibold text-slate-900 mb-4">
            Recommended certifications for: {selectedCareer}
          </p>
          
          <div className="space-y-4">
            {PROVIDERS.filter(p => {
              const path = CAREER_PATHS.find(cp => cp.name === selectedCareer);
              return path?.providers.includes(p.id);
            }).map((provider) => (
              <div key={provider.id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10">
                      <Image src={provider.logo} alt={provider.name} fill className="object-contain" sizes="100vw" />
                    </div>
                    <span className="font-bold text-slate-900">{provider.name}</span>
                  </div>
                  <span className="text-sm text-slate-600">From {provider.examFee}</span>
                </div>
                <Link
                  href={`/testing/${provider.id}`}
                  className="block w-full text-center py-2 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Book Exam
                </Link>
              </div>
            ))}
            
            {selectedCareer && findProviders(selectedCareer).length === 0 && (
              <div className="text-center p-6">
                <p className="text-slate-600 mb-4">
                  We offer many certifications across different industries.
                </p>
                <Link
                  href="/testing"
                  className="inline-block px-6 py-3 bg-brand-red-600 text-white font-semibold rounded-lg"
                >
                  Browse All Exams
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Testing Process Timeline
function TestingProcess() {
  const steps = [
    { icon: '📝', title: 'Book', desc: 'Schedule your exam online' },
    { icon: '📧', title: 'Confirm', desc: 'Receive confirmation email' },
    { icon: '✅', title: 'Check-In', desc: 'Arrive 15 minutes early' },
    { icon: '🔐', title: 'Verify', desc: 'Identity verification' },
    { icon: '📝', title: 'Test', desc: 'Complete your exam' },
    { icon: '📊', title: 'Results', desc: 'Immediate scoring' },
    { icon: '🏆', title: 'Credential', desc: 'Digital certificate issued' },
  ];

  return (
    <div className="relative">
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2" />
      
      <div className="space-y-8">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`relative flex items-center ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
          >
            <div className={`flex-1 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
              <div className="bg-white rounded-xl p-5 shadow-lg border border-slate-200">
                <span className="text-2xl mb-2 block">{step.icon}</span>
                <h4 className="font-bold text-slate-900">{step.title}</h4>
                <p className="text-sm text-slate-600">{step.desc}</p>
              </div>
            </div>
            <div className="hidden md:flex w-10 h-10 bg-brand-red-600 rounded-full items-center justify-center text-white font-bold shrink-0 z-10">
              {i + 1}
            </div>
            <div className="flex-1" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// What to Expect Checklist
function WhatToExpect() {
  const bring = [
    { item: 'Government-issued photo ID', required: true },
    { item: 'Confirmation email (printed or digital)', required: true },
    { item: 'Arrive 15 minutes early', required: true },
    { item: 'Second form of ID (if required)', required: false },
  ];

  const dontBring = [
    { item: 'Cell phones', icon: '📱' },
    { item: 'Smart watches', icon: '⌚' },
    { item: 'Personal bags', icon: '👜' },
    { item: 'Notes or study materials', icon: '📚' },
    { item: 'Food or drinks', icon: '🍕' },
    { item: 'Calculator (unless permitted)', icon: '🔢' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
        <h3 className="text-xl font-bold text-green-800 mb-4">✓ Bring With You</h3>
        <div className="space-y-3">
          {bring.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <Image src={ICONS.check} alt="Check" width={20} height={20} className="object-contain shrink-0 mt-0.5" sizes="(max-width: 768px) 100vw, 50vw" />
              <span className="text-green-800">{item.item}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
        <h3 className="text-xl font-bold text-red-800 mb-4">✗ Do Not Bring</h3>
        <div className="space-y-3">
          {dontBring.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-red-800">{item.item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Exam Preparation Section
function ExamPreparation() {
  const resources = [
    { icon: '📖', title: 'Practice Exams', desc: 'Test your knowledge before exam day' },
    { icon: '🎓', title: 'Prep Courses', desc: 'Instructor-led exam preparation classes' },
    { icon: '📚', title: 'Study Guides', desc: 'Official study materials and resources' },
    { icon: '💻', title: 'Online Modules', desc: 'Self-paced online preparation' },
    { icon: '👨‍🏫', title: 'Tutoring', desc: 'One-on-one support available' },
    { icon: '📝', title: 'Workshops', desc: 'Group exam readiness workshops' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {resources.map((resource, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="text-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <span className="text-3xl mb-2 block">{resource.icon}</span>
          <p className="font-semibold text-slate-900 text-sm">{resource.title}</p>
          <p className="text-xs text-slate-600 mt-1">{resource.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

// Interactive Package Builder Demo Section
function PackageBuilderDemo() {
  const demoExams = [
    { id: 'cma', name: 'Certified Medical Assistant (CMA)', price: 249, duration: '2.5 hours' },
    { id: 'cpt', name: 'Phlebotomy Technician (CPT)', price: 149, duration: '2 hours' },
    { id: 'cet', name: 'EKG Technician (CET)', price: 149, duration: '2 hours' },
  ];

  const demoBundles = [
    {
      id: 'healthcare-bundle',
      name: 'Healthcare Career Bundle',
      description: 'Complete preparation for healthcare certification',
      items: ['CMA Exam', 'Study Guide', 'Practice Test', 'CPR Cert'],
      originalPrice: 497,
      bundlePrice: 399,
      savings: 98,
    },
  ];

  return (
    <div id="build-package" className="max-w-6xl mx-auto">
      <PricingConfigurator
        provider="demo"
        exams={demoExams}
        bundles={demoBundles}
      />
    </div>
  );
}

// Provider Card Component
function ProviderCard({ provider }: { provider: typeof PROVIDERS[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200"
    >
      <div className="relative h-48">
        <Image
          src={provider.heroImage}
          alt={provider.name}
          fill
          className="object-cover" sizes="100vw"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${provider.accent} opacity-60`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-20 h-20 bg-white rounded-xl p-2 shadow-lg">
            <Image
              src={provider.logo}
              alt={`${provider.name} logo`}
              fill
              className="object-contain" sizes="100vw"
            />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-1">{provider.fullName}</h3>
        <p className="text-sm text-slate-600 mb-4">Exam fee: {provider.examFee}</p>
        
        <div className="space-y-2 mb-6">
          {provider.certifications.slice(0, 2).map((cert, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Image src={ICONS.check} alt="Check" width={16} height={16} className="object-contain shrink-0" sizes="(max-width: 768px) 100vw, 50vw" />
              <span className="text-slate-700">{cert.name}</span>
            </div>
          ))}
          {provider.certifications.length > 2 && (
            <p className="text-sm text-brand-red-600 font-medium">
              +{provider.certifications.length - 2} more certifications
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/testing/${provider.id}#build-package`}
            className={`flex-1 text-center py-3 bg-gradient-to-r ${provider.accent} text-white font-bold rounded-lg hover:opacity-90 transition-opacity`}
          >
            Build Package
          </Link>
          <Link
            href={`/testing/${provider.id}`}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Employer Testing Section
function EmployerTesting() {
  return (
    <section className="py-20 bg-slate-900 text-white px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Employer Testing Partnerships
            </h2>
            <p className="text-xl text-white/80 mb-6">
              We partner with employers to provide workforce testing, pre-employment assessments, 
              and ongoing certification support.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                'Corporate testing programs',
                'Pre-employment assessments',
                'Employee certification tracking',
                'Group scheduling available',
                'On-site testing options',
                'Private testing sessions',
              ].map((service, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Image src={ICONS.checkWhite} alt="Check" width={20} height={20} className="object-contain shrink-0" sizes="(max-width: 768px) 100vw, 50vw" />
                  <span className="text-white/90">{service}</span>
                </div>
              ))}
            </div>
            
            <Link
              href="/testing/for-employers"
              className="inline-flex items-center px-8 py-4 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-bold rounded-lg text-lg transition-colors"
            >
              Become a Testing Partner
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-xl font-bold mb-6">Organization Types We Serve</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'Manufacturing',
                  'Healthcare',
                  'Retail',
                  'Hospitality',
                  'Construction',
                  'Logistics',
                  'Government',
                  'Education',
                ].map((type, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Image src={ICONS.checkWhite} alt="Check" width={16} height={16} className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
                    <span className="text-white/90">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Trust Indicators
function TrustIndicators() {
  const trustPoints = [
    { icon: ICONS.shield, title: 'Secure Environment', desc: 'Proctored exams with identity verification' },
    { icon: ICONS.certificate, title: 'Official Credentials', desc: 'Nationally recognized certifications' },
    { icon: ICONS.calendar, title: 'Flexible Scheduling', desc: 'Multiple test dates and times' },
    { icon: ICONS.dollar, title: 'Payment Options', desc: 'Multiple payment methods available' },
    { icon: ICONS.users, title: 'Trained Proctors', desc: 'Authorized exam administration' },
    { icon: ICONS.book, title: 'Career Resources', desc: 'Resume and interview support available' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {trustPoints.map((point, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="text-center p-4 bg-slate-50 rounded-xl"
        >
          <div className="relative w-12 h-12 mx-auto mb-3">
            <Image src={point.icon} alt={point.title} fill className="object-contain" sizes="100vw" />
          </div>
          <p className="font-bold text-slate-900 text-sm">{point.title}</p>
          <p className="text-xs text-slate-600 mt-1">{point.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

// School Partnerships Section
function SchoolPartnerships() {
  return (
    <section className="py-20 bg-slate-50 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            School & Workforce Board Partnerships
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Partner with us to provide testing access for your students, clients, and workforce programs
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          {['High Schools', 'Colleges', 'Workforce Boards', 'Adult Education', 'Career Centers'].map((partner, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-center p-6 bg-white rounded-xl border border-slate-200"
            >
              <p className="font-bold text-slate-900">{partner}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center">
          <Link
            href="/testing/for-employers"
            className="inline-flex items-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg text-lg transition-colors"
          >
            Become a Testing Partner
          </Link>
        </div>
      </div>
    </section>
  );
}

// Main Component
export function PremiumTestingCenter() {
  const [heroVideoReady, setHeroVideoReady] = useState(false);

  return (
    <main className="bg-white">
      
      {/* ===== CINEMATIC HERO ===== */}
      <section className="relative h-[clamp(420px,58vh,720px)] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <Image
            src="/images/pages/testing-page-1.webp"
            alt="Indiana workforce credential testing center"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => setHeroVideoReady(true)}
            onCanPlay={() => setHeroVideoReady(true)}
            onError={() => setHeroVideoReady(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${heroVideoReady ? 'opacity-100' : 'opacity-0'}`}
          >
            <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/testing-hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-900/90 via-brand-blue-900/70 to-brand-blue-900/50" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="inline-block px-4 py-1 bg-brand-gold-500 text-slate-900 text-sm font-bold rounded-full mb-6">
              Authorized Testing Center
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Indiana's Workforce<br />Credential Testing Center
            </h1>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Earn nationally recognized certifications through secure, professionally proctored testing. 
              NHA, ACT WorkKeys, Certiport, EPA 608, and more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/testing/book"
                className="px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg text-lg transition-colors text-center"
              >
                Book My Exam
              </Link>
              <Link
                href="#providers"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/30 transition-colors text-center"
              >
                View Certifications
              </Link>
              <Link
                href="/testing/for-employers"
                className="px-8 py-4 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-bold rounded-lg text-lg transition-colors text-center"
              >
                Become a Partner
              </Link>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2" />
          </div>
        </motion.div>
      </section>

      {/* ===== TRUST INDICATORS ===== */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Why Test With Elevate?</h2>
          </div>
          <TrustIndicators />
        </div>
      </section>

      {/* ===== INTERACTIVE EXAM FINDER ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Find the Right Certification
            </h2>
            <p className="text-lg text-slate-600">Not sure which exam you need? Let us help.</p>
          </motion.div>
          
          <ExamFinder />
        </div>
      </section>

      {/* ===== PROVIDER CARDS ===== */}
      <section id="providers" className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Our Testing Providers
            </h2>
            <p className="text-lg text-slate-600">
              Authorized testing center for industry-leading certification providers
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROVIDERS.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTING PROCESS ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600">
              From booking to receiving your credential
            </p>
          </motion.div>
          
          <TestingProcess />
        </div>
      </section>

      {/* ===== WHAT TO EXPECT ===== */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              What to Expect on Test Day
            </h2>
          </motion.div>
          
          <WhatToExpect />
        </div>
      </section>

      {/* ===== EXAM PREPARATION ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Prepare for Success
            </h2>
            <p className="text-lg text-slate-600">
              We offer multiple preparation resources to help you pass on the first try
            </p>
          </motion.div>
          
          <ExamPreparation />
          
          <div className="text-center mt-8">
            <Link
              href="/programs"
              className="inline-flex items-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg text-lg transition-colors"
            >
              View Exam Prep Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ===== INTERACTIVE PACKAGE BUILDER ===== */}
      <section id="build-package" className="py-20 bg-slate-100 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Build Your Exam Package
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Choose your exam and customize with add-ons. See real-time pricing with bundle savings and funding options.
            </p>
          </motion.div>
          
          <PackageBuilderDemo />
        </div>
      </section>

      {/* ===== EMPLOYER TESTING ===== */}
      <EmployerTesting />

      {/* ===== SCHOOL PARTNERSHIPS ===== */}
      <SchoolPartnerships />

      {/* ===== FAQ ===== */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>
          
          <div className="space-y-4">
            {[
              { q: 'How do I schedule an exam?', a: 'You can book your exam online through our scheduling system, by calling our testing center, or through our AI assistant. We offer multiple dates and times to fit your schedule. All exams are by appointment only.' },
              { q: 'How much do exams cost?', a: 'Exam fees vary by provider and certification. We use dynamic pricing based on provider costs, proctoring, and overhead. Contact us for a custom quote or use our pricing configurator to build your package.' },
              { q: 'How long are exams?', a: 'Exam length varies by certification. Most exams range from 1-3 hours. We\'ll provide a time estimate when you book.' },
              { q: 'When will I receive my results?', a: 'Results availability varies by provider. Many computer-based exams provide immediate scores. Credential issuance timelines depend on the certification body. We will provide specific timelines during booking.' },
              { q: 'Can I retake an exam?', a: 'Retake policies vary by provider. Most allow retakes after a waiting period. We can help you schedule a retake if needed.' },
              { q: 'What if I need accommodations?', a: 'We provide testing accommodations for candidates with disabilities. Contact us in advance to arrange accommodations. Note that provider approval may be required for some accommodations.' },
            ].map((faq, i) => (
              <details key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="p-5 font-semibold text-slate-900 cursor-pointer hover:bg-slate-50">
                  {faq.q}
                </summary>
                <div className="p-5 pt-0 text-slate-700">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 bg-gradient-to-br from-brand-red-700 to-brand-red-900 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              Ready to Earn Your Credential?
            </h2>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Whether you're advancing your career, preparing for a new job, or meeting employer requirements, 
              we're here to support you from registration through certification.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/testing/book"
                className="px-8 py-4 bg-white text-brand-red-700 font-bold rounded-lg text-lg hover:bg-slate-100 transition-colors"
              >
                Book My Exam
              </Link>
              <Link
                href="/programs"
                className="px-8 py-4 bg-brand-gold-500 text-slate-900 font-bold rounded-lg text-lg hover:bg-brand-gold-600 transition-colors"
              >
                Explore Training Programs
              </Link>
              <Link
                href="https://www.elevateforhumanity.org/contact"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg border border-white/30 transition-colors"
              >
                Contact the Testing Center
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}

export default PremiumTestingCenter;
