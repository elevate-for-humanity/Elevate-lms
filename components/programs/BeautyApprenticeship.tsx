/**
 * BeautyApprenticeshipPage
 * 
 * Luxury beauty institute experience for Barber, Cosmetology, Esthetics, and Manicurist
 * apprenticeships. Feels like a premium beauty school with apprenticeship benefits built in.
 * 
 * Features:
 * - Cinematic hero videos
 * - Interactive calculators (tuition, income, timeline, funding)
 * - Mentor profiles
 * - Graduate success stories
 * - Business building section
 * - Premium visual storytelling
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Program types
type BeautyProgram = 'barber' | 'cosmetology' | 'esthetics' | 'manicurist';

interface BeautyApprenticeshipPageProps {
  program: BeautyProgram;
}

// Program-specific data
const PROGRAM_DATA = {
  barber: {
    title: 'Barber Apprenticeship',
    tagline: 'Master the Art of Barbering',
    subtitle: 'Learn precision cutting, straight razor shaves, beard design, and shop management through our DOL-registered apprenticeship.',
    heroVideo: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/barber-apprenticeship-hero.mp4',
    heroImage: '/images/beauty/barber-hero.webp',
    accentColor: 'from-slate-800 to-slate-900',
    goldAccent: 'text-amber-400',
    services: [
      { name: 'Haircuts', icon: '✂️' },
      { name: 'Beard Design', icon: '🧔' },
      { name: 'Straight Razor Shaves', icon: '🪒' },
      { name: 'Color Services', icon: '🎨' },
      { name: 'Hot Towel Treatments', icon: '🧴' },
    ],
    curriculum: [
      'Precision Haircutting Techniques',
      'Beard Sculpting & Design',
      'Straight Razor Mastery',
      'Hot Towel Facial Treatments',
      'Shop Management & Operations',
      'Client Consultation',
      'Sanitation & Safety',
      'Product Knowledge',
      'Business & Marketing',
      'Portfolio Development',
    ],
    careers: [
      'Traditional Barbershop',
      'Modern Grooming Lounge',
      'Luxury Spa',
      'Men\'s Salon',
      'Cruise Ship',
      'Film & Television',
      'Platform Artist',
      'Barber Educator',
      'Shop Owner',
    ],
    startingSalary: '$35,000 - $55,000',
    midCareerSalary: '$55,000 - $80,000',
    boothRental: '$60,000 - $100,000+',
    hours: '2,000 hours',
    duration: '12-18 months',
  },
  cosmetology: {
    title: 'Cosmetology Apprenticeship',
    tagline: 'Transform Hair Into Art',
    subtitle: 'Master hair coloring, cutting, styling, and client services through paid apprenticeship in professional salons.',
    heroVideo: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/cosmetology-apprenticeship-hero.mp4',
    heroImage: '/images/beauty/cosmetology-hero.webp',
    accentColor: 'from-pink-700 to-rose-800',
    goldAccent: 'text-pink-300',
    services: [
      { name: 'Hair Coloring', icon: '🎨' },
      { name: 'Balayage', icon: '🌅' },
      { name: 'Hair Cutting', icon: '✂️' },
      { name: 'Blowouts & Styling', icon: '💨' },
      { name: 'Extensions', icon: '💇‍♀️' },
    ],
    curriculum: [
      'Color Theory & Application',
      'Balayage & Highlights',
      'Hair Cutting Techniques',
      'Blowout Mastery',
      'Bridal & Special Occasions',
      'Extensions & Textures',
      'Makeup Application',
      'Retail Sales',
      'Client Retention',
      'Business Building',
    ],
    careers: [
      'Luxury Salon',
      'Full-Service Spa',
      'Hair Colorist',
      'Styling Specialist',
      'Bridal Stylist',
      'Education',
      'Product Development',
      'Salon Owner',
      'Platform Artist',
    ],
    startingSalary: '$30,000 - $45,000',
    midCareerSalary: '$45,000 - $65,000',
    boothRental: '$50,000 - $90,000+',
    hours: '2,000 hours',
    duration: '18-24 months',
  },
  esthetics: {
    title: 'Esthetics Apprenticeship',
    tagline: 'Transform Skin, Transform Lives',
    subtitle: 'Learn advanced skincare treatments, facials, chemical peels, and spa services through luxury spa apprenticeships.',
    heroVideo: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/esthetics-apprenticeship-hero.mp4',
    heroImage: '/images/beauty/esthetics-hero.webp',
    accentColor: 'from-purple-700 to-violet-800',
    goldAccent: 'text-purple-300',
    services: [
      { name: 'Facials', icon: '✨' },
      { name: 'Chemical Peels', icon: '🧪' },
      { name: 'Dermaplaning', icon: '💎' },
      { name: 'LED Therapy', icon: '💡' },
      { name: 'Waxing', icon: '🕯️' },
    ],
    curriculum: [
      'Skin Analysis',
      'Facial Treatments',
      'Chemical Peel Applications',
      'Dermaplaning',
      'LED Light Therapy',
      'Waxing Techniques',
      'Product Knowledge',
      'Medical Esthetics',
      'Spa Business',
      'Client Consultation',
    ],
    careers: [
      'Luxury Spa',
      'Medical Spa',
      'Dermatology Office',
      'Plastic Surgery Center',
      'Hotel & Resort Spa',
      'Cruise Ship',
      'Skin Care Educator',
      'Product Representative',
      'Spa Owner',
    ],
    startingSalary: '$32,000 - $42,000',
    midCareerSalary: '$42,000 - $60,000',
    boothRental: '$45,000 - $80,000+',
    hours: '700 hours + apprenticeship',
    duration: '12-18 months',
  },
  manicurist: {
    title: 'Nail Technician Apprenticeship',
    tagline: 'Turn Creativity Into a Career',
    subtitle: 'Master nail artistry, gel, acrylics, and spa pedicures through professional salon apprenticeships.',
    heroVideo: 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/videos/nail-technician-apprenticeship-hero.mp4',
    heroImage: '/images/beauty/nails-hero.webp',
    accentColor: 'from-teal-600 to-cyan-700',
    goldAccent: 'text-teal-300',
    services: [
      { name: 'Gel Manicures', icon: '💅' },
      { name: 'Acrylic Extensions', icon: '✨' },
      { name: 'Nail Art', icon: '🎨' },
      { name: 'Pedicures', icon: '🦶' },
      { name: 'Dip Powder', icon: '💎' },
    ],
    curriculum: [
      'Nail Anatomy',
      'Gel Application',
      'Acrylic Extensions',
      'Dip Powder Techniques',
      'Nail Art & Design',
      'Luxury Pedicures',
      'Sanitation Protocols',
      'Product Knowledge',
      'Retail Sales',
      'Business Basics',
    ],
    careers: [
      'Nail Salon',
      'Luxury Spa',
      'Hotel Spa',
      'Mobile Nail Artist',
      'Salon Suite',
      'Nail Art Specialist',
      'Education',
      'Product Ambassador',
      'Salon Owner',
    ],
    startingSalary: '$25,000 - $35,000',
    midCareerSalary: '$35,000 - $50,000',
    boothRental: '$40,000 - $70,000+',
    hours: '700 hours + apprenticeship',
    duration: '6-12 months',
  },
};

// Mentor data
const MENTORS = [
  {
    name: 'Marcus Thompson',
    role: 'Master Barber Instructor',
    photo: '/images/beauty/mentor-barber-1.webp',
    bio: '15+ years experience in traditional and modern barbering. Specializes in precision cuts and straight razor techniques.',
    credentials: ['Licensed Barber', 'DOL Registered Instructor', 'Master Barber'],
  },
  {
    name: 'Keisha Williams',
    role: 'Color Specialist',
    photo: '/images/beauty/mentor-color-1.webp',
    bio: 'Award-winning colorist specializing in balayage and color correction. Trained at Vidal Sassoon Academy.',
    credentials: ['Licensed Cosmetologist', 'Goldwell Color Certified', 'Pravana Elite Artist'],
  },
  {
    name: 'Jennifer Chen',
    role: 'Medical Esthetician',
    photo: '/images/beauty/mentor-skin-1.webp',
    bio: 'Former dermatology nurse now leading our esthetics program. Expert in clinical skincare treatments.',
    credentials: ['Licensed Esthetician', 'Certified Medical Esthetician', 'PCA Skin Certified'],
  },
];

// Success stories
const SUCCESS_STORIES = [
  {
    name: 'Destiny R.',
    program: 'Barber Apprenticeship',
    before: 'Working fast food, no career direction',
    after: 'Owns her own barbershop, $85K+ annually',
    quote: 'I thought beauty school was out of reach. The apprenticeship let me earn while I learned. Now I\'m building my own empire.',
    photo: '/images/beauty/success-destiny.webp',
    transformation: '/images/beauty/transformation-destiny.webp',
  },
  {
    name: 'Marcus L.',
    program: 'Cosmetology',
    before: 'College dropout, unsure of career path',
    after: 'Senior stylist at luxury salon, $62K annually',
    quote: 'The mentorship made all the difference. I learned from the best and now I\'m the one teaching others.',
    photo: '/images/beauty/success-marcus.webp',
    transformation: '/images/beauty/transformation-marcus.webp',
  },
  {
    name: 'Sophia K.',
    program: 'Esthetics',
    before: 'Stay-at-home mom returning to workforce',
    after: 'Medical spa esthetician, $55K annually + tips',
    quote: 'I was intimidated to start over. The flexible schedule and support system made it possible for me.',
    photo: '/images/beauty/success-sophia.webp',
    transformation: '/images/beauty/transformation-sophia.webp',
  },
];

// Icon images
const ICONS = {
  check: '/images/icons/check-circle.webp',
  checkWhite: '/images/icons/check-white.webp',
  calculator: '/images/icons/calculator.webp',
  calendar: '/images/icons/calendar.webp',
  dollar: '/images/icons/dollar.webp',
  trend: '/images/icons/trend.webp',
  clock: '/images/icons/clock.webp',
  graduation: '/images/icons/graduation.webp',
  briefcase: '/images/icons/briefcase.webp',
  users: '/images/icons/users.webp',
  play: '/images/icons/play.webp',
  download: '/images/icons/download.webp',
  phone: '/images/icons/phone.webp',
  email: '/images/icons/email.webp',
  salon: '/images/icons/salon.webp',
  scissors: '/images/icons/scissors.webp',
};

// ============= CALCULATOR COMPONENTS =============

// Tuition Calculator
function TuitionCalculator({ program }: { program: typeof PROGRAM_DATA.barber }) {
  const [fundingType, setFundingType] = useState<'workforce' | 'employer' | 'self' | 'bnpl'>('self');
  const [deposit, setDeposit] = useState(500);
  const [weeks, setWeeks] = useState(52);
  
  const tuition = 4980;
  const remaining = tuition - deposit;
  const weeklyPayment = (remaining / weeks).toFixed(2);
  const monthlyPayment = (remaining / (weeks / 4)).toFixed(2);
  
  const fundingDescriptions = {
    workforce: 'Potentially $0 out-of-pocket through WIOA, Workforce Ready Grant, or VR funding',
    employer: 'Sponsored by employer partner - potentially $0 out-of-pocket',
    self: 'Deposit + weekly payments with automatic billing',
    bnpl: 'Finance your education with monthly payments, no full tuition upfront',
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Tuition Calculator</h3>
      
      {/* Funding Type Selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">How will you pay?</p>
        <div className="grid grid-cols-2 gap-2">
          {(['workforce', 'employer', 'self', 'bnpl'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFundingType(type)}
              className={`p-3 rounded-lg text-sm font-medium transition-all ${
                fundingType === type
                  ? 'bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type === 'workforce' && 'Workforce Funding'}
              {type === 'employer' && 'Employer Sponsored'}
              {type === 'self' && 'Self Pay'}
              {type === 'bnpl' && 'Buy Now, Pay Later'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Description */}
      <div className="p-4 bg-slate-50 rounded-lg mb-6">
        <p className="text-sm text-slate-700">{fundingDescriptions[fundingType]}</p>
      </div>
      
      {/* Payment Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between py-2 border-b">
          <span className="text-slate-600">Program Tuition</span>
          <span className="font-bold text-slate-900">${tuition.toLocaleString()}</span>
        </div>
        {fundingType !== 'workforce' && fundingType !== 'employer' && (
          <>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Registration Fee</span>
              <span className="font-bold text-slate-900">$150</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Deposit</span>
              <span className="font-bold text-slate-900">${deposit}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Remaining Balance</span>
              <span className="font-bold text-brand-red-600">${remaining.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-slate-600">Weekly Payment</span>
              <span className="font-bold text-brand-red-600">${weeklyPayment}/week</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Monthly Payment</span>
              <span className="font-bold text-brand-red-600">${monthlyPayment}/month</span>
            </div>
          </>
        )}
      </div>
      
      {/* Apply Button */}
      <Link
        href={`/programs/${fundingType === 'barber' ? 'barber-apprenticeship' : fundingType === 'cosmetology' ? 'cosmetology-apprenticeship' : fundingType === 'esthetics' ? 'esthetician-apprenticeship' : 'nail-technician-apprenticeship'}/apply`}
        className="block w-full text-center py-4 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
      >
        Apply Now
      </Link>
    </div>
  );
}

// Income Projection Calculator
function IncomeCalculator({ program }: { program: typeof PROGRAM_DATA.barber }) {
  const [services, setServices] = useState(15);
  const [price, setPrice] = useState(40);
  const [days, setDays] = useState(5);
  const [tips, setTips] = useState(15);
  
  const dailyRevenue = services * price;
  const weeklyRevenue = dailyRevenue * days;
  const monthlyRevenue = weeklyRevenue * 4;
  const annualRevenue = weeklyRevenue * 52;
  const annualTips = dailyRevenue * (tips / 100) * days * 52;
  const grossAnnual = annualRevenue + annualTips;
  
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Income Projection Calculator</h3>
      <p className="text-sm text-slate-600 mb-6">See your potential earning as a licensed professional</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-sm font-medium text-slate-700">Services per day</label>
          <input
            type="range"
            min={5}
            max={30}
            value={services}
            onChange={(e) => setServices(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center font-bold text-slate-900">{services} services</div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Average price per service</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">$</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Days worked per week</label>
          <input
            type="range"
            min={3}
            max={7}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center font-bold text-slate-900">{days} days</div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-slate-700">Average tip percentage</label>
          <input
            type="range"
            min={0}
            max={30}
            value={tips}
            onChange={(e) => setTips(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center font-bold text-slate-900">{tips}%</div>
        </div>
      </div>
      
      {/* Results */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <div className="text-center mb-4">
          <p className="text-sm text-slate-400">Projected Annual Income</p>
          <p className="text-4xl font-black">${(grossAnnual).toLocaleString()}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-slate-400">Weekly</p>
            <p className="font-bold">${weeklyRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400">Monthly</p>
            <p className="font-bold">${monthlyRevenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400">With Tips</p>
            <p className="font-bold text-amber-400">+${annualTips.toLocaleString()}</p>
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mt-4 text-center">
          *Before expenses. Actual income varies based on location, clientele, and business model.
        </p>
      </div>
    </div>
  );
}

// Apprenticeship Timeline Calculator
function TimelineCalculator({ program }: { program: typeof PROGRAM_DATA.barber }) {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  
  const totalHours = 2000;
  const weeksNeeded = Math.ceil(totalHours / hoursPerWeek);
  const monthsNeeded = Math.ceil(weeksNeeded / 4);
  const rtiHours = Math.floor(totalHours * 0.25); // 25% related technical instruction
  const ojlHours = Math.floor(totalHours * 0.75); // 75% on-the-job learning
  
  const milestones = [
    { percent: 0, label: 'Application Complete', status: 'complete' },
    { percent: 5, label: 'Salon Matched', status: hoursPerWeek > 0 ? 'complete' : 'pending' },
    { percent: 10, label: 'Orientation', status: 'pending' },
    { percent: 25, label: '500 OJL Hours', status: 'pending' },
    { percent: 50, label: '1,000 Hours', status: 'pending' },
    { percent: 75, label: '1,500 Hours', status: 'pending' },
    { percent: 100, label: 'Licensure Ready', status: 'pending' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Apprenticeship Timeline</h3>
      
      <div className="mb-6">
        <label className="text-sm font-medium text-slate-700">Hours available per week</label>
        <input
          type="range"
          min={10}
          max={40}
          value={hoursPerWeek}
          onChange={(e) => setHoursPerWeek(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-center font-bold text-slate-900">{hoursPerWeek} hours/week</div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600">Estimated Duration</p>
          <p className="text-2xl font-bold text-slate-900">{monthsNeeded} months</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 text-center">
          <p className="text-sm text-slate-600">Completion Date</p>
          <p className="text-2xl font-bold text-brand-red-600">
            {new Date(Date.now() + monthsNeeded * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
      
      {/* Progress Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-700">RTI (Classroom)</span>
          <span className="font-bold text-slate-900">{rtiHours} hours (25%)</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-brand-red-500 to-brand-red-600 h-3 rounded-full" style={{ width: '25%' }} />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-700">OJL (On-the-Job)</span>
          <span className="font-bold text-slate-900">{ojlHours} hours (75%)</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full" style={{ width: '75%' }} />
        </div>
      </div>
      
      {/* Milestones */}
      <div className="space-y-2">
        {milestones.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              m.status === 'complete' ? 'bg-green-500' : 'bg-slate-200'
            }`}>
              {m.status === 'complete' && (
                <Image src={ICONS.check} alt="Complete" width={12} height={12} className="object-contain" />
              )}
            </div>
            <span className={`text-sm ${m.status === 'complete' ? 'text-green-600 font-medium' : 'text-slate-600'}`}>
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Funding Eligibility Wizard
function FundingWizard() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  
  const questions = [
    { id: 'indiana', q: 'Are you an Indiana resident?', icon: '🏠' },
    { id: 'veteran', q: 'Are you a veteran or spouse of a veteran?', icon: '🎖️' },
    { id: 'employed', q: 'Are you currently employed?', icon: '💼' },
    { id: 'workforce', q: 'Are you currently receiving Workforce services?', icon: '🏢' },
    { id: 'vocrehab', q: 'Are you a Vocational Rehabilitation client?', icon: '♿' },
    { id: 'justice', q: 'Have you been involved with the justice system?', icon: '⚖️' },
    { id: 'lowincome', q: 'Do you meet low-income guidelines?', icon: '📊' },
  ];
  
  const potentialFunding = [
    { name: 'WIOA Funding', desc: 'Potential: 100% tuition coverage', eligible: true },
    { name: 'Workforce Ready Grant', desc: 'If eligible: Up to $5,000', eligible: answers.indiana },
    { name: 'Vocational Rehabilitation', desc: 'If applicable: Full support', eligible: answers.vocrehab },
    { name: 'Employer Sponsorship', desc: 'If employed: Partner coverage', eligible: answers.employed },
    { name: 'Self-Pay with BNPL', desc: 'Weekly payments, no credit check', eligible: true },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Funding Eligibility Check</h3>
      
      {step < questions.length ? (
        <div>
          <div className="mb-6">
            <p className="text-sm text-slate-500 mb-2">Question {step + 1} of {questions.length}</p>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-brand-red-500 to-brand-red-600 h-2 rounded-full transition-all"
                style={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <p className="text-xl font-bold text-slate-900 mb-6">
            {questions[step].icon} {questions[step].q}
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setAnswers({ ...answers, [questions[step].id]: true });
                setStep(step + 1);
              }}
              className="p-4 bg-green-100 hover:bg-green-200 text-green-800 font-bold rounded-lg transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => {
                setAnswers({ ...answers, [questions[step].id]: false });
                setStep(step + 1);
              }}
              className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors"
            >
              No
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-6">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg font-bold text-slate-900">You may qualify for multiple funding sources!</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {potentialFunding.map((funding, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <Image src={ICONS.check} alt="Eligible" width={24} height={24} className="object-contain" />
                <div>
                  <p className="font-bold text-slate-900">{funding.name}</p>
                  <p className="text-sm text-slate-600">{funding.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          <Link
            href="/check-eligibility"
            className="block w-full text-center py-4 bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Your Personalized Funding Plan
          </Link>
          
          <button
            onClick={() => { setStep(0); setAnswers({}); }}
            className="w-full mt-3 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}

// Business Calculator
function BusinessCalculator({ program }: { program: typeof PROGRAM_DATA.barber }) {
  const [model, setModel] = useState<'employee' | 'booth' | 'suite' | 'mobile' | 'owner'>('employee');
  
  const models = {
    employee: {
      title: 'Salon Employee',
      baseSalary: 32000,
      commission: 40,
      tips: 8000,
      expenses: 0,
    },
    booth: {
      title: 'Booth Rental',
      baseSalary: 0,
      commission: 100,
      tips: 12000,
      expenses: 500,
    },
    suite: {
      title: 'Salon Suite',
      baseSalary: 0,
      commission: 100,
      tips: 15000,
      expenses: 1500,
    },
    mobile: {
      title: 'Mobile Barber',
      baseSalary: 0,
      commission: 100,
      tips: 10000,
      expenses: 800,
    },
    owner: {
      title: 'Salon Owner',
      baseSalary: 40000,
      commission: 0,
      tips: 0,
      expenses: 5000,
    },
  };

  const current = models[model];
  const monthlyRevenue = (current.baseSalary / 12) + (current.commission > 0 ? 8000 * (current.commission / 100) : 0) + (current.tips / 12);
  const monthlyExpenses = current.expenses;
  const monthlyProfit = monthlyRevenue - monthlyExpenses;
  const annualProfit = monthlyProfit * 12;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
      <h3 className="text-2xl font-bold text-slate-900 mb-6">Beauty Business Calculator</h3>
      <p className="text-sm text-slate-600 mb-6">See your potential as an employee vs. business owner</p>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {(Object.keys(models) as Array<keyof typeof models>).map((key) => (
          <button
            key={key}
            onClick={() => setModel(key)}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              model === key
                ? 'bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {models[key].title}
          </button>
        ))}
      </div>
      
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 text-white">
        <p className="text-sm text-slate-400 mb-2">Estimated Annual Income</p>
        <p className="text-4xl font-black mb-4">${Math.max(0, annualProfit).toLocaleString()}</p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Monthly Profit</p>
            <p className="font-bold">${Math.max(0, monthlyProfit).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-slate-400">Monthly Expenses</p>
            <p className="font-bold text-red-400">-${monthlyExpenses.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-4">
        *Estimates based on industry averages. Actual results vary.
      </p>
    </div>
  );
}

// FAQ Component
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = [
    { q: 'How does an apprenticeship differ from beauty school?', a: 'In an apprenticeship, you learn inside a working salon while getting paid. Traditional beauty school is primarily classroom-based. Our apprenticeship combines both: you earn related technical instruction (RTI) in the classroom while building real-world experience through on-the-job learning (OJL) in a professional salon.' },
    { q: 'Will I work with real clients during training?', a: 'Yes! That\'s one of the biggest advantages of an apprenticeship. From day one, you\'ll work alongside experienced professionals, observing, assisting, and eventually servicing clients under supervision. By graduation, you\'ll have a full client portfolio.' },
    { q: 'Do I get paid while training?', a: 'Most apprentices receive wages for their on-the-job learning hours. Your host shop employer will pay you at least the federal minimum wage (often more), making this an earn-while-you-learn opportunity.' },
    { q: 'How many hours are required for licensure?', a: 'Barber and cosmetology licenses in Indiana require 2,000 hours. Our apprenticeship program allocates approximately 500 hours of related technical instruction (RTI) and 1,500 hours of on-the-job learning (OJL).' },
    { q: 'What certifications will I earn?', a: 'Upon completion, you\'ll receive: your state barber or cosmetology license, a DOL Registered Apprenticeship completion certificate, and various industry certifications depending on your program.' },
    { q: 'Can I open my own salon after graduating?', a: 'Absolutely! Many of our graduates go on to open their own barbershops or salons. We include business training in our curriculum, and we can connect you with resources for small business development.' },
    { q: 'Is funding available?', a: 'Yes! Many apprentices qualify for WIOA funding, Workforce Ready Grant, Vocational Rehabilitation support, or employer sponsorship. Our advisors will help you explore every option during your enrollment consultation.' },
    { q: 'Can I make weekly payments?', a: 'Yes! We offer flexible self-pay options with weekly or bi-weekly payments. We also partner with financing providers for Buy Now, Pay Later options with no credit check required.' },
  ];

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
          >
            <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
            <span className={`text-2xl transition-transform ${openIndex === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-5 pt-0 text-slate-700 bg-white">
                  {faq.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ============= MAIN PAGE COMPONENT =============

export function BeautyApprenticeshipPage({ program: programType }: BeautyApprenticeshipPageProps) {
  const program = PROGRAM_DATA[programType];
  
  return (
    <main className="bg-white">
      
      {/* ===== CINEMATIC HERO ===== */}
      <section className={`relative min-h-[100vh] flex items-center justify-center overflow-hidden bg-gradient-to-br ${program.accentColor}`}>
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={program.heroImage}
          >
            <source src={program.heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full mb-6">
              DOL Registered Apprenticeship
            </span>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              {program.tagline}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              {program.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={`/programs/${programType}-apprenticeship/apply`}
                className="px-10 py-4 bg-white text-slate-900 font-bold rounded-lg text-lg hover:bg-slate-100 transition-colors"
              >
                Apply Now
              </Link>
              <Link
                href="/contact"
                className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/30 transition-colors"
              >
                Tour the Shop
              </Link>
              <Link
                href="/check-eligibility"
                className="px-10 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-lg transition-colors"
              >
                Explore Funding
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-8 h-14 border-2 border-white/50 rounded-full flex justify-center">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-3 bg-white/50 rounded-full mt-2"
            />
          </div>
        </motion.div>
      </section>

      {/* ===== IMAGINE YOURSELF ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-8">
              Imagine Yourself Here
            </h2>
            
            <div className="prose prose-lg text-slate-700 space-y-6">
              <p>
                Imagine walking into your salon on your very first day. Your mentor welcomes you. 
                Clients begin arriving. Every haircut, every facial, every color service helps you build confidence.
              </p>
              <p>
                Week after week your skills improve. Month after month your clientele grows. 
                By graduation you won't just have classroom experience—you'll already have worked with real clients 
                inside a professional salon.
              </p>
              <p className="text-xl font-medium text-slate-900">
                That's the power of apprenticeship.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== WHY APPRENTICESHIP VS SCHOOL ===== */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Why Choose an Apprenticeship?
            </h2>
            <p className="text-lg text-slate-600">The best way to learn a trade is by doing the trade.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Traditional School */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 border-2 border-slate-200"
            >
              <h3 className="text-xl font-bold text-slate-600 mb-6 text-center">Traditional Beauty School</h3>
              <div className="space-y-4">
                {[
                  'Mostly classroom instruction',
                  'Limited real-world experience',
                  'Graduate, then find work',
                  'Pay tuition upfront',
                  'Build theory before practice',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-red-500 text-xl">✗</span>
                    <span className="text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* Apprenticeship */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white"
            >
              <h3 className="text-xl font-bold mb-6 text-center">Elevate Apprenticeship</h3>
              <div className="space-y-4">
                {[
                  'Learn inside a working salon',
                  'Employer mentorship from day one',
                  'Real clients, real experience',
                  'Get paid while you learn',
                  'Career coaching included',
                  'Industry credentials earned',
                  'Professional portfolio built',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Image src={ICONS.checkWhite} alt="Check" width={20} height={20} className="object-contain shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== YOUR JOURNEY TIMELINE ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Your Journey
            </h2>
          </motion.div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -translate-x-1/2" />
            
            <div className="space-y-8">
              {[
                { step: '1', title: 'Apply', desc: 'Complete our simple application online', icon: '📝' },
                { step: '2', title: 'Meet Advisor', desc: 'One-on-one consultation to discuss your goals', icon: '🤝' },
                { step: '3', title: 'Funding Review', desc: 'Explore funding options and payment plans', icon: '💰' },
                { step: '4', title: 'Salon Match', desc: 'Get matched with a host shop partner', icon: '🏪' },
                { step: '5', title: 'Orientation', desc: 'Learn the program, meet your mentor', icon: '🎓' },
                { step: '6', title: 'Training Begins', desc: 'Start your apprenticeship journey', icon: '✂️' },
                { step: '7', title: 'Graduation', desc: 'Complete hours, pass state exam, get licensed', icon: '🎉' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative flex items-center gap-6 md:gap-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                      <span className="text-3xl mb-2 block">{item.icon}</span>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-12 h-12 bg-gradient-to-br from-brand-red-500 to-brand-red-600 rounded-full items-center justify-center text-white font-bold shrink-0 z-10">
                    {item.step}
                  </div>
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHAT YOU'LL LEARN ===== */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              What You'll Learn
            </h2>
            <p className="text-lg text-slate-600">Skills that employers value and clients trust</p>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {program.curriculum.map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-5 text-center border border-slate-200 hover:shadow-lg hover:border-brand-red-300 transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                  <Image src={ICONS.scissors} alt="" width={24} height={24} className="object-contain" />
                </div>
                <p className="text-sm font-medium text-slate-900">{topic}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INTERACTIVE CALCULATORS ===== */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Plan Your Future
            </h2>
            <p className="text-lg text-slate-400">Interactive tools to help you make informed decisions</p>
          </motion.div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <TuitionCalculator program={program} />
            <IncomeCalculator program={program} />
            <TimelineCalculator program={program} />
            <FundingWizard />
            <div className="lg:col-span-2">
              <BusinessCalculator program={program} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Services You'll Master
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {program.services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-slate-50 rounded-2xl"
              >
                <span className="text-4xl mb-3 block">{service.icon}</span>
                <p className="font-bold text-slate-900">{service.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SALARY EXPECTATIONS ===== */}
      <section className="py-20 bg-gradient-to-br from-amber-500 to-orange-600 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Career Earnings Potential
            </h2>
            <p className="text-lg text-white/90">Build your income over time</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 text-center"
            >
              <p className="text-sm text-slate-600 mb-2">Starting Salary</p>
              <p className="text-3xl font-black text-slate-900 mb-2">{program.startingSalary}</p>
              <p className="text-sm text-slate-500">per year</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 text-center border-4 border-amber-400"
            >
              <span className="inline-block px-3 py-1 bg-amber-400 text-slate-900 text-xs font-bold rounded-full mb-3">MOST POPULAR</span>
              <p className="text-sm text-slate-600 mb-2">Mid-Career</p>
              <p className="text-3xl font-black text-slate-900 mb-2">{program.midCareerSalary}</p>
              <p className="text-sm text-slate-500">per year</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 text-center"
            >
              <p className="text-sm text-slate-600 mb-2">Booth/Suite Rental</p>
              <p className="text-3xl font-black text-slate-900 mb-2">{program.boothRental}</p>
              <p className="text-sm text-slate-500">potential annual</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CAREER OPPORTUNITIES ===== */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Career Opportunities
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {program.careers.map((career, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200"
              >
                <Image src={ICONS.briefcase} alt="" width={20} height={20} className="object-contain shrink-0" />
                <span className="text-sm font-medium text-slate-700">{career}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BUILD YOUR BUSINESS ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                Build Your Own Beauty Business
              </h2>
              <p className="text-lg text-slate-700 mb-6">
                Many beauty professionals aspire to own their own salon or barbershop. 
                Our program prepares you for that future.
              </p>
              
              <div className="space-y-4">
                {[
                  'Branding & Social Media Marketing',
                  'Pricing Your Services',
                  'Client Retention Strategies',
                  'Taxes & Business Registration',
                  'Booth Rental vs. Suite Ownership',
                  'Financial Literacy',
                  'Building Multiple Income Streams',
                ].map((topic, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Image src={ICONS.check} alt="Check" width={20} height={20} className="object-contain shrink-0" />
                    <span className="text-slate-700">{topic}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="relative rounded-2xl overflow-hidden">
                <Image
                  src={program.heroImage}
                  alt="Beauty business"
                  width={600}
                  height={400}
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end">
                  <div className="p-6">
                    <p className="text-white font-bold text-xl">Your license is just the beginning.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== MEET YOUR MENTORS ===== */}
      <section className="py-20 bg-slate-50 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Meet Your Mentors
            </h2>
            <p className="text-lg text-slate-600">Learn from industry professionals</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {MENTORS.map((mentor, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg"
              >
                <div className="relative h-64">
                  <Image
                    src={mentor.photo}
                    alt={mentor.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{mentor.name}</h3>
                  <p className="text-sm text-brand-red-600 font-medium mb-3">{mentor.role}</p>
                  <p className="text-sm text-slate-600 mb-4">{mentor.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {mentor.credentials.map((cred, j) => (
                      <span key={j} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {cred}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SUCCESS STORIES ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Student Success Stories
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {SUCCESS_STORIES.map((story, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200"
              >
                <div className="relative h-48">
                  <Image src={story.photo} alt={story.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                </div>
                <div className="p-6">
                  <p className="text-sm text-brand-red-600 font-semibold mb-2">{story.program}</p>
                  <p className="text-lg text-slate-900 mb-4">"{story.quote}"</p>
                  <div className="pt-4 border-t">
                    <p className="font-bold text-slate-900">{story.name}</p>
                    <p className="text-sm text-slate-600">Before: {story.before}</p>
                    <p className="text-sm text-green-600 font-medium">After: {story.after}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FUNDING YOUR FUTURE ===== */}
      <section className="py-20 bg-gradient-to-br from-brand-blue-900 to-slate-900 text-white px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Funding Your Future
            </h2>
            <p className="text-lg text-white/80">Multiple paths to affordable education</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Workforce Funding', desc: 'Potentially $0 out-of-pocket through WIOA, Workforce Ready Grant, or VR', icon: '🏛️' },
              { title: 'Employer Sponsored', desc: 'Partner employers may cover tuition in exchange for commitment', icon: '💼' },
              { title: 'Self Pay + BNPL', desc: 'Flexible weekly payments or Buy Now, Pay Later options', icon: '💳' },
            ].map((option, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center"
              >
                <span className="text-4xl mb-4 block">{option.icon}</span>
                <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                <p className="text-white/80 text-sm">{option.desc}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link
              href="/check-eligibility"
              className="inline-flex items-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-lg transition-colors"
            >
              Check Your Eligibility
            </Link>
          </div>
        </div>
      </section>

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
          
          <FAQSection />
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={program.heroImage}
          >
            <source src={program.heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/80" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Your Future Starts Behind the Chair
            </h2>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              Whether your dream is working in a luxury salon, owning your own studio, 
              or building a beauty brand, your journey begins here.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={`/programs/${programType}-apprenticeship/apply`}
                className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg text-lg hover:bg-slate-100 transition-colors"
              >
                Apply for Apprenticeship
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg text-lg transition-colors"
              >
                Schedule a Tour
              </Link>
              <Link
                href="/check-eligibility"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-lg border border-white/30 transition-colors"
              >
                Explore Funding
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}

export default BeautyApprenticeshipPage;
