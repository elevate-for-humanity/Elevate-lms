'use client';

import { useState } from 'react';
import { Briefcase, DollarSign, Building2, Landmark, ArrowRight, Users, CreditCard, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface JourneyOption {
  id: string;
  icon: React.ReactNode;
  headline: string;
  subtext: string;
  cta: string;
  href: string;
  audience: string;
  features?: string[];
}

const JOURNEY_OPTIONS: JourneyOption[] = [
  {
    id: 'career',
    icon: <Briefcase className="w-8 h-8" />,
    headline: 'Start My Career Journey',
    subtext: 'Explore programs, check funding eligibility, and apply for training. From unemployed to employed.',
    cta: 'Explore Programs',
    href: '/programs',
    audience: 'Unemployed, underemployed, career changers',
    features: ['WIOA funding available', 'Apprenticeship programs', 'Job placement support']
  },
  {
    id: 'funding',
    icon: <DollarSign className="w-8 h-8" />,
    headline: 'Check My Funding Options',
    subtext: 'WIOA, VR, employer sponsorship, or payment plans—we\'ll help you find what you qualify for.',
    cta: 'Check Eligibility',
    href: '/check-eligibility',
    audience: 'Anyone concerned about tuition cost',
    features: ['Free training possible', 'Payment plans', 'No credit check required']
  },
  {
    id: 'employer',
    icon: <Building2 className="w-8 h-8" />,
    headline: 'Build My Workforce',
    subtext: 'Hire apprenticeship graduates, sponsor employee training, or post job opportunities.',
    cta: 'Partner With Us',
    href: '/employer',
    audience: 'Business owners, HR departments, workforce managers',
    features: ['Pre-screened candidates', 'Customized training', 'WIOA employer partnerships']
  },
  {
    id: 'agency',
    icon: <Landmark className="w-8 h-8" />,
    headline: 'Partner with Elevate',
    subtext: 'Refer participants, access program data, or build custom workforce solutions.',
    cta: 'Agency Portal',
    href: '/for-agencies',
    audience: 'WorkOne, VR, workforce boards, economic development',
    features: ['WIOA approved provider', 'DOL registered apprenticeship', 'Compliance reporting']
  }
];

export function JourneySelector() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Can We Help You Today?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you're looking for training, funding, or workforce solutions, 
            Elevate has a pathway for you.
          </p>
        </div>

        {/* Journey Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {JOURNEY_OPTIONS.map((option) => (
            <Link href={option.href} key={option.id}>
              <Card 
                className={`
                  relative h-full p-6 transition-all duration-300 cursor-pointer
                  ${hoveredId === option.id 
                    ? 'shadow-xl -translate-y-2 border-brand-blue-500' 
                    : 'shadow-md hover:shadow-lg'}
                  bg-white overflow-hidden group
                `}
                onMouseEnter={() => setHoveredId(option.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Gradient accent on hover */}
                <div className={`
                  absolute inset-0 bg-gradient-to-br from-brand-blue-500/5 to-brand-blue-600/10 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                `} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300
                    ${hoveredId === option.id 
                      ? 'bg-brand-blue-600 text-white' 
                      : 'bg-brand-blue-100 text-brand-blue-700'}
                  `}>
                    {option.icon}
                  </div>

                  {/* Text */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {option.headline}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {option.subtext}
                  </p>

                  {/* Features (show on hover) */}
                  {hoveredId === option.id && option.features && (
                    <ul className="space-y-1 mb-4 animate-fadeIn">
                      {option.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA */}
                  <div className={`
                    flex items-center font-semibold transition-colors duration-300
                    ${hoveredId === option.id ? 'text-brand-blue-600' : 'text-brand-blue-700'}
                  `}>
                    {option.cta}
                    <ArrowRight className={`
                      w-4 h-4 ml-2 transition-transform duration-300
                      ${hoveredId === option.id ? 'translate-x-1' : ''}
                    `} />
                  </div>
                </div>

                {/* Audience badge */}
                <div className="absolute top-4 right-4">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {option.audience.split(',')[0]}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatItem 
            icon={<Users className="w-5 h-5" />}
            value="100%"
            label="Funding Support"
          />
          <StatItem 
            icon={<GraduationCap className="w-5 h-5" />}
            value="94%"
            label="Completion Rate"
          />
          <StatItem 
            icon={<CreditCard className="w-5 h-5" />}
            value="68%"
            label="Pay $0 Tuition"
          />
          <StatItem 
            icon={<Building2 className="w-5 h-5" />}
            value="75+"
            label="Hiring Partners"
          />
        </div>
      </div>
    </section>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center p-4 bg-white rounded-xl shadow-sm">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-600 mb-2">
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

export default JourneySelector;
