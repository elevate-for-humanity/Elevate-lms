'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Award, DollarSign } from 'lucide-react';

const PROGRAMS = [
  {
    category: 'Healthcare',
    slug: 'medical-assistant',
    name: 'Medical Assistant',
    duration: '12 weeks',
    credential: 'NHA CCMA Certification',
    price: '$5,000',
    deposit: '$0 with funding',
    payNote: '$79/week with BNPL',
    image: '/programs/medical-assistant.jpg',
    outcomes: ['Clinical Medical Assistant', 'EHR Specialist', 'Patient Coordinator', 'Phlebotomy Tech'],
    funding: ['WIOA', 'SNAP', 'Next Level Jobs', 'Employer'],
    color: 'bg-blue-50 border-blue-200',
    badge: 'Most Popular',
    badgeColor: 'bg-blue-600',
  },
  {
    category: 'Healthcare',
    slug: 'phlebotomy',
    name: 'Phlebotomy Technician',
    duration: '6 weeks',
    credential: 'NHA CPT Certification',
    price: '$2,500',
    deposit: '$0 with funding',
    payNote: '$35/week with BNPL',
    image: '/programs/phlebotomy.jpg',
    outcomes: ['Phlebotomist', 'Lab Assistant', 'Blood Bank Tech'],
    funding: ['WIOA', 'SNAP', 'Next Level Jobs'],
    color: 'bg-blue-50 border-blue-200',
    badge: 'Fast Track',
    badgeColor: 'bg-green-600',
  },
  {
    category: 'Trades',
    slug: 'hvac-technician',
    name: 'HVAC Technician',
    duration: '8 weeks',
    credential: 'EPA 608 Certification',
    price: '$5,000',
    deposit: '$0 with funding',
    payNote: '$79/week with BNPL',
    image: '/programs/hvac.jpg',
    outcomes: ['HVAC Installer', 'Service Technician', 'Maintenance Tech', 'Refrigeration Specialist'],
    funding: ['WIOA', 'SNAP', 'Employer', 'Next Level Jobs'],
    color: 'bg-orange-50 border-orange-200',
    badge: 'High Demand',
    badgeColor: 'bg-orange-600',
  },
  {
    category: 'Beauty',
    slug: 'barber',
    name: 'Barber Apprenticeship',
    duration: '12 months',
    credential: 'State Barber License',
    price: '$6,500',
    deposit: '$0 with funding',
    payNote: '$99/week with BNPL',
    image: '/programs/barber.jpg',
    outcomes: ['Licensed Barber', 'Shop Manager', 'Platform Artist', 'Shop Owner'],
    funding: ['WIOA', 'SNAP', 'Apprenticeship Grant'],
    color: 'bg-purple-50 border-purple-200',
    badge: 'Earn While You Learn',
    badgeColor: 'bg-purple-600',
  },
  {
    category: 'Beauty',
    slug: 'cosmetology',
    name: 'Cosmetology',
    duration: '12 months',
    credential: 'State Cosmetology License',
    price: '$7,500',
    deposit: '$0 with funding',
    payNote: '$110/week with BNPL',
    image: '/programs/cosmetology.jpg',
    outcomes: ['Licensed Cosmetologist', 'Color Specialist', 'Esthetician', 'Salon Owner'],
    funding: ['WIOA', 'SNAP', 'Employer'],
    color: 'bg-pink-50 border-pink-200',
    badge: '',
    badgeColor: 'bg-pink-600',
  },
  {
    category: 'Testing',
    slug: 'act-workkeys',
    name: 'ACT WorkKeys',
    duration: '2 weeks',
    credential: 'NCRC Gold/Platinum',
    price: '$299',
    deposit: '$0',
    payNote: 'One-time payment',
    image: '/programs/workkeys.jpg',
    outcomes: ['NCRC Credential', 'Job Ready Certificate', 'Career Advancement'],
    funding: ['WIOA', 'SNAP'],
    color: 'bg-green-50 border-green-200',
    badge: 'Quick Start',
    badgeColor: 'bg-green-600',
  },
];

export default function ProgramSelectionPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(PROGRAMS.map(p => p.category)))];
  const filtered = selectedCategory && selectedCategory !== 'All'
    ? PROGRAMS.filter(p => p.category === selectedCategory)
    : PROGRAMS;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/enrollment-v2" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Enrollment
          </Link>
          <h1 className="text-4xl font-bold mb-4">Choose Your Program</h1>
          <p className="text-slate-300 text-lg">
            Select the program that fits your career goals. All programs include funding assistance and BNPL options.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
              className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
                (cat === 'All' && !selectedCategory) || cat === selectedCategory
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Program Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((program) => (
            <div key={program.slug} className={`${program.color} border-2 rounded-2xl p-6 flex flex-col`}>
              {program.badge && (
                <div className={`${program.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-3`}>
                  {program.badge}
                </div>
              )}
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{program.category}</div>
              <h3 className="text-xl font-bold mb-1">{program.name}</h3>

              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  <Clock className="w-3 h-3" /> {program.duration}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  <Award className="w-3 h-3" /> {program.credential}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-slate-900">{program.price}</span>
                <span className="text-sm text-slate-500">total</span>
              </div>
              <div className="text-sm text-slate-600 mb-4">{program.deposit}</div>
              <div className="text-sm font-medium text-green-700 mb-4">{program.payNote}</div>

              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Career Outcomes</p>
                <div className="flex flex-wrap gap-1">
                  {program.outcomes.map(o => (
                    <span key={o} className="text-xs bg-white/60 text-slate-700 px-2 py-0.5 rounded-full">{o}</span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Funding Accepted</p>
                <div className="flex flex-wrap gap-1">
                  {program.funding.map(f => (
                    <span key={f} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">{f}</span>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-200/50">
                <Link
                  href={`/enrollment-v2/apply?program=${program.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  Apply for {program.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Need Help */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Not Sure Which Program?</h3>
          <p className="text-slate-600 mb-6">Paris AI can help you find the right fit based on your goals and funding eligibility.</p>
          <Link
            href="/enrollment-v2/apply"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Talk to Paris AI <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
