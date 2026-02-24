'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Star } from 'lucide-react';
import type { PricingTier } from '@/app/data/programs';

interface PricingTiersProps {
  programSlug: string;
  programName: string;
  tiers?: PricingTier[];
  basePrice?: number;
  examVoucherPrice?: number;
  retakeVoucherPrice?: number;
  fundingAvailable?: boolean;
}

export function PricingTiers({
  programSlug,
  programName,
  tiers,
  basePrice = 0,
  examVoucherPrice = 0,
  retakeVoucherPrice = 0,
  fundingAvailable = true,
}: PricingTiersProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Generate default tiers if none provided
  const defaultTiers: PricingTier[] = [
    {
      id: 'training-only',
      name: 'Training Only',
      description: 'Complete program training and materials',
      price: basePrice,
      includes: [
        'Full program curriculum',
        'Online learning materials',
        'Instructor support',
        'Certificate of Completion',
        'Career services access',
      ],
    },
    {
      id: 'training-exam',
      name: 'Training + Exam',
      description: 'Training plus certification exam voucher',
      price: basePrice + examVoucherPrice,
      includes: [
        'Everything in Training Only',
        'Certification exam voucher',
        'Exam prep materials',
        'Practice tests',
        'Scheduling assistance',
      ],
      popular: true,
    },
    {
      id: 'training-exam-retake',
      name: 'Complete Package',
      description: 'Training, exam, and retake voucher',
      price: basePrice + examVoucherPrice + retakeVoucherPrice,
      includes: [
        'Everything in Training + Exam',
        'One exam retake voucher',
        'Extended support period',
        'Priority scheduling',
        'Structured certification preparation pathway',
      ],
    },
  ];

  const displayTiers = tiers && tiers.length > 0 ? tiers : defaultTiers;

  // Don't show pricing if everything is free/funded
  if (basePrice === 0 && examVoucherPrice === 0 && fundingAvailable) {
    return (
      <div className="bg-brand-green-50 border-2 border-brand-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-brand-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-green-900">100% Funded Training</h3>
            <p className="text-brand-green-700">No cost to eligible participants</p>
          </div>
        </div>
        <p className="text-gray-700 mb-4">
          This program is available at no cost through workforce funding programs. 
          Training, materials, and certification exam fees may be covered.
        </p>
        <Link
          href={`/apply?program=${programSlug}`}
          className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          Check Your Eligibility
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Package</h3>
        <p className="text-gray-600">Select the option that best fits your needs</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {displayTiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative bg-white rounded-2xl border-2 p-6 transition-all cursor-pointer ${
              tier.popular
                ? 'border-brand-blue-500 shadow-lg scale-105'
                : selectedTier === tier.id
                ? 'border-brand-blue-400 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTier(tier.id)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1 bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  <Star className="w-3 h-3" /> Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <h4 className="text-lg font-bold text-gray-900">{tier.name}</h4>
              <p className="text-sm text-gray-500">{tier.description}</p>
            </div>

            <div className="text-center mb-6">
              {tier.price === 0 ? (
                <div className="text-3xl font-bold text-brand-green-600">FREE</div>
              ) : (
                <div>
                  <span className="text-3xl font-bold text-gray-900">${tier.price.toLocaleString()}</span>
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {tier.includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/enroll/${programSlug}?tier=${tier.id}`}
              className={`block w-full text-center py-3 rounded-xl font-semibold transition ${
                tier.popular
                  ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Select {tier.name}
            </Link>
          </div>
        ))}
      </div>

      {fundingAvailable && (
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 text-center">
          <p className="text-brand-blue-800">
            <strong>Funding may be available!</strong> Many participants qualify for 
            workforce funding that covers all or part of program costs.{' '}
            <Link href="/funding" className="underline font-semibold">
              Learn about funding options
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
