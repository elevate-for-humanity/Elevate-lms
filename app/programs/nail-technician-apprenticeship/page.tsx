// Force static generation for performance
export const dynamic = 'force-static';
export const revalidate = 86400;

import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import { FundingBadge } from '@/components/programs/FundingBadge';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { HostShopRequirements } from '@/components/compliance/HostShopRequirements';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';


export const metadata: Metadata = {
  title:
    'Registered Nail Technician Apprenticeship | DOL Sponsorship & Oversight | Indiana',
  description:
    'DOL Registered Nail Technician Apprenticeship sponsorship, oversight, and related instruction (Milady Theory) in Indiana. Federal apprenticeship sponsorship, employer coordination, compliance reporting. ETPL approved. This program does not grant nail technician licensure or clock hours toward state exams.',
  keywords:
    'nail technician apprenticeship Indiana, DOL registered apprenticeship, apprenticeship sponsorship, nail tech training Indianapolis, RAPIDS registered, ETPL approved, manicurist apprenticeship',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship',
  },
};

export default async function NailTechnicianApprenticeshipPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch nail technician apprenticeship program
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', 'nail-technician-apprenticeship')
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Nail Technician Apprenticeship' },
        ]}
      />
      {/* Hero Section */}
      <section className="relative w-full -mt-[72px] min-h-[70vh] flex items-center bg-pink-600">
        <div className="absolute inset-0 bg-[url('/images/patterns/grid.svg')] opacity-10" />
        <div className="relative z-10 mx-auto max-w-6xl px-6 py-32 md:py-40">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <FundingBadge type="self-pay" className="bg-amber-500 text-white border-0" />
            <span className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-full shadow-lg">
              DOL Registered
            </span>
            <span className="px-3 py-2 bg-blue-600 text-white text-sm font-bold rounded-full shadow-lg">
              Apprenticeship Sponsorship
            </span>
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl text-white drop-shadow-2xl">
            Registered Nail Technician Apprenticeship
          </h1>

          <p className="mt-6 max-w-2xl text-lg md:text-xl text-white leading-relaxed drop-shadow-lg">
            Registered Nail Technician Apprenticeship Sponsorship, Oversight & Related Instruction (Milady Theory). 
            This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/apply?pathway=nail-technician-apprenticeship"
              className="inline-flex items-center justify-center rounded-lg bg-pink-500 px-8 py-4 text-lg font-bold text-white hover:bg-pink-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Start Eligibility & Choose a Career Path
            </Link>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/barber-guide.mp4" title="Nail Technician Apprenticeship Guide" />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Nail Technician Apprenticeship" programSlug="nail-technician-apprenticeship" />

      {/* Program Description */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">Program Description</h2>
          <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-6 mb-8">
            <p className="text-lg text-black leading-relaxed">
              <strong>Registered Nail Technician Apprenticeship Sponsorship, Oversight & Related Instruction (Milady Theory).</strong>
            </p>
            <p className="text-black mt-4 leading-relaxed">
              This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction. 
              Practical skills training and licensure-required instructional hours are provided by a licensed nail technician or cosmetology school. 
              This program does not grant nail technician licensure or clock hours toward state exams.
            </p>
          </div>

          {/* Indiana Requirements */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-blue-900 mb-3">Indiana Nail Technician Requirements</h3>
            <ul className="space-y-2 text-blue-900">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span><strong>450 hours</strong> of nail technician training required</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Pass written and practical exams</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>Prepares learners for licensure through <strong>Indiana Professional Licensing Agency (IPLA)</strong></span>
              </li>
            </ul>
          </div>

          {/* What's Included vs Not Included */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6" />
                What the Program Fee Covers
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>DOL Registered Apprenticeship sponsorship</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Compliance and RAPIDS reporting</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Employer (salon) coordination and OJT verification</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Program monitoring and completion documentation</span>
                </li>
                <li className="flex items-start gap-3 text-green-900">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Related Instruction: Milady theory curriculum</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6" />
                What the Program Fee Does NOT Cover
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Practical hands-on nail technician training</span>
                </li>
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>State licensure-required instructional hours</span>
                </li>
                <li className="flex items-start gap-3 text-red-900">
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Nail technician school enrollment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-6">Program Fee</h2>
          
          <div className="bg-white border-2 border-slate-200 rounded-xl p-8 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-pink-600">$2,980</div>
              <div className="text-xl text-slate-600 mt-2">Flat Program Fee</div>
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
              <p className="text-pink-900 text-center">
                <strong>The program fee applies regardless of transferred hours.</strong> Credit for prior learning may reduce the duration of participation but does not alter the program fee. The fee reflects apprenticeship sponsorship, compliance oversight, employer coordination, related instruction, and completion under the sponsor&apos;s registered apprenticeship program.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-black">Payment Options</h3>
              
              <Link
                href="/apply?program=nail-technician-apprenticeship&payment_method=full"
                className="w-full flex items-center justify-between px-6 py-4 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-lg transition-all"
              >
                <div>
                  <div className="font-bold text-lg">Pay in Full</div>
                  <div className="text-sm text-pink-200">One-time payment of $2,980</div>
                </div>
                <span className="text-2xl font-bold">$2,980</span>
              </Link>

              <Link
                href="/apply?program=nail-technician-apprenticeship&payment_method=plan&months=4"
                className="w-full flex items-center justify-between px-6 py-4 bg-white border-2 border-pink-300 hover:border-pink-500 text-black font-bold rounded-lg transition-all"
              >
                <div>
                  <div className="font-bold text-lg">4-Month Plan</div>
                  <div className="text-sm text-slate-600">4 payments of $745</div>
                </div>
                <span className="text-xl font-bold text-pink-600">$745/mo</span>
              </Link>

              <Link
                href="/apply?program=nail-technician-apprenticeship&payment_method=plan&months=6"
                className="w-full flex items-center justify-between px-6 py-4 bg-white border-2 border-pink-300 hover:border-pink-500 text-black font-bold rounded-lg transition-all"
              >
                <div>
                  <div className="font-bold text-lg">6-Month Plan</div>
                  <div className="text-sm text-slate-600">6 payments of $497</div>
                </div>
                <span className="text-xl font-bold text-pink-600">$497/mo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-3xl font-bold text-black mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-black mb-2">
                Does the $2,980 change if I transfer in hours?
              </h3>
              <p className="text-slate-700">
                No. The program fee is a flat rate. Transferred hours reduce time-in-program, not the scope of services or fee.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-black mb-2">
                Does this program replace nail technician school?
              </h3>
              <p className="text-slate-700">
                No. Apprentices must complete licensure-required instructional hours through a licensed nail technician or cosmetology school.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-black mb-2">
                What does the $2,980 cover?
              </h3>
              <p className="text-slate-700">
                Federal apprenticeship sponsorship, compliance reporting, employer coordination, Milady theory instruction, and program completion documentation.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-black mb-2">
                How many hours are required for an Indiana nail technician license?
              </h3>
              <p className="text-slate-700">
                Indiana requires 450 hours of nail technician training to be eligible for licensure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Host Shop Requirements Section */}
      <HostShopRequirements 
        programTrack="nail-technician" 
        showApprovalProcess={true}
        showMultiRegion={true}
      />

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Nail Technician Apprenticeship"
            partnerCertifications={[
              'Indiana Manicurist License (issued by Indiana Professional Licensing Agency)',
              'USDOL Registered Apprenticeship Certificate of Completion',
            ]}
            employmentOutcomes={[
              'Licensed Nail Technician',
              'Manicurist/Pedicurist',
              'Nail Salon Owner/Operator',
              'Nail Art Specialist',
            ]}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-pink-600">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-pink-100 text-lg mb-8">
            Apply now to begin your journey in the Registered Nail Technician Apprenticeship program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/apply?program=nail-technician-apprenticeship"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-bold text-pink-600 hover:bg-pink-50 transition-all shadow-xl"
            >
              Apply Now
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-bold text-white hover:bg-white/10 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
