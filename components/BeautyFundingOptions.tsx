'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  DollarSign, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  CheckCircle,
  ChevronDown,
  Building2,
  Users,
  FileText
} from 'lucide-react';

interface FundingOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  eligible: string[];
  color: string;
  details: string[];
}

const fundingOptions: FundingOption[] = [
  {
    id: 'wioa',
    name: 'WIOA / WorkOne',
    icon: <Building2 className="w-8 h-8" />,
    description: 'Federal workforce development funding for adults and dislocated workers.',
    eligible: ['Unemployed', 'Underemployed', 'Displaced workers', 'Low-income individuals'],
    color: 'bg-blue-500',
    details: [
      'May cover 100% of tuition',
      'Includes books and supplies',
      'Certification exam fees included',
      'Supportive services available',
    ],
  },
  {
    id: 'impact',
    name: 'FSSA IMPACT',
    icon: <Users className="w-8 h-8" />,
    description: 'Indiana\'s SNAP E&T program for recipients of SNAP, TANF, or other public assistance.',
    eligible: ['SNAP recipients', 'TANF recipients', 'Cash assistance recipients'],
    color: 'bg-green-500',
    details: [
      'Free training for eligible participants',
      'Transportation assistance',
      'Childcare support available',
      'Career placement services',
    ],
  },
  {
    id: 'wrg',
    name: 'Workforce Ready Grant',
    icon: <GraduationCap className="w-8 h-8" />,
    description: 'State-funded grant covering training costs for in-demand occupations.',
    eligible: ['Indiana residents', 'High-demand occupations', 'First-time recipients'],
    color: 'bg-purple-500',
    details: [
      'Up to 100% tuition coverage',
      'No cost to eligible participants',
      'Fast approval process',
      'Used across Indiana ETPL providers',
    ],
  },
  {
    id: 'jri',
    name: 'Job Ready Indy (JRI)',
    icon: <Briefcase className="w-8 h-8" />,
    description: 'Marion County workforce program for residents seeking job training.',
    eligible: ['Marion County residents', 'Job seekers', 'Career changers'],
    color: 'bg-amber-500',
    details: [
      'Tuition assistance available',
      'Books and supplies included',
      'Career coaching included',
      'Job placement support',
    ],
  },
  {
    id: 'employer',
    name: 'Employer Sponsorship',
    icon: <Building2 className="w-8 h-8" />,
    description: 'Your employer covers training costs while you earn wages working.',
    eligible: ['Employed individuals', 'Employer partners', 'Salon/spa staff'],
    color: 'bg-teal-500',
    details: [
      'Earn while you learn',
      'Tuition covered by employer',
      'Build experience at work',
      'No upfront costs to you',
    ],
  },
  {
    id: 'selfpay',
    name: 'Self-Pay / Payment Plans',
    icon: <CreditCard className="w-8 h-8" />,
    description: 'Flexible payment options starting with a low deposit and weekly payments.',
    eligible: ['Everyone', 'No eligibility requirements'],
    color: 'bg-gray-600',
    details: [
      '$600 minimum deposit',
      'Weekly payment plans',
      'BNPL options (Klarna, Afterpay, Zip)',
      'Income-share available',
    ],
  },
];

export default function BeautyFundingOptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-600 text-sm font-semibold uppercase tracking-wider">
            Funding & Financial Assistance
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
            Affordable Paths to Your Career
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Multiple funding options available. Most apprentices pay $0-$600 upfront. 
            We'll help you find the best option for your situation.
          </p>
        </div>

        {/* Funding Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fundingOptions.map((option) => (
            <div
              key={option.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Header */}
              <div className={`${option.color} p-6 text-white`}>
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white/20 rounded-xl">
                    {option.icon}
                  </div>
                  {option.id === 'selfpay' && (
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mt-4">{option.name}</h3>
                <p className="text-white/90 text-sm mt-2">{option.description}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Who Qualifies */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Who Qualifies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {option.eligible.map((item, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expandable Details */}
                <button
                  onClick={() => setExpandedId(expandedId === option.id ? null : option.id)}
                  className="w-full flex items-center justify-between text-amber-600 font-medium py-2 border-t border-gray-100"
                >
                  <span>What&apos;s Covered</span>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedId === option.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedId === option.id && (
                  <ul className="space-y-2 pt-2 pb-4">
                    {option.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}

                {/* CTA */}
                <a
                  href={`/funding/${option.id}`}
                  className="block w-full text-center py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Calculator CTA */}
        <div className="mt-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-8 text-center">
          <DollarSign className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">
            Self-Pay: $600 Down, Then Weekly Payments
          </h3>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            No funding? No problem. Start your apprenticeship with just $600 down 
            and spread the rest over weekly payments. BNPL options available at checkout.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/programs/barber-apprenticeship#payment-calculator"
              className="inline-flex items-center px-6 py-3 bg-white text-amber-600 font-bold rounded-lg hover:bg-gray-100 transition-all"
            >
              <FileText className="w-5 h-5 mr-2" />
              Calculate Payments
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>WIOA Title I Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Indiana ETPL Listed</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>DOL Registered Sponsor</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>WorkOne Partner</span>
          </div>
        </div>
      </div>
    </section>
  );
}