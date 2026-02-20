import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  Clock,
  DollarSign,
  Home,
  Lightbulb,
  TrendingUp,
  Users,
  XCircle,
CheckCircle, } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title:
    'Tax Preparer Jobs Indianapolis | Work From Home | Supersonic Fast Cash Careers',
  description:
    'Join our team of PTIN-credentialed tax preparers. Earn $20-$50/hour. Work from home anywhere in the USA or in-office (Indianapolis). Flexible schedule. Tax season and year-round positions available nationwide.',
  keywords: [
    'tax preparer jobs Indianapolis',
    'tax preparer hiring Indianapolis',
    'tax preparer jobs',
    'work from home tax preparer Indiana',
    'remote tax preparer jobs',
    'seasonal tax jobs Indianapolis',
    'tax season employment',
    'tax professional careers',
    'H&R Block alternative jobs',
    'TurboTax Live alternative',
    'tax preparer wanted Indianapolis',
    'hiring tax professionals Indiana',
  ],
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/careers',
  },
};

export default async function TaxCareersPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  
  // Fetch tax career positions
  const { data: dbPositions } = await supabase
    .from('job_postings')
    .select('*')
    .eq('department', 'tax_services')
    .eq('status', 'active');

  const positions = dbPositions?.length ? dbPositions : [
    {
      title: 'IRS-Certified Tax Preparer',
      type: 'Seasonal & Year-Round',
      pay: '$20-$35/hour',
      location: 'Hybrid (Remote + In-Office)',
      description:
        'Prepare individual and business tax returns for clients across Indiana',
      requirements: [
        'IRS PTIN (Preparer Tax Identification Number)',
        'Completion of IRS Annual Filing Season Program OR',
        'EA, CPA, or tax law degree',
        '1+ years tax preparation experience preferred',
        'Proficient with tax software (SupersonicFastCash, ProSeries, or similar)',
      ],
    },
    {
      title: 'Senior Tax Professional',
      type: 'Year-Round',
      pay: '$35-$50/hour',
      location: 'Hybrid (Remote + In-Office)',
      description:
        'Handle complex returns, mentor junior preparers, quality review',
      requirements: [
        'EA (Enrolled Agent) or CPA required',
        '3+ years tax preparation experience',
        'Experience with business returns, partnerships, S-Corps',
        'Strong client communication skills',
        'Ability to train and mentor staff',
      ],
    },
    {
      title: 'Tax Season Associate',
      type: 'Seasonal (Jan-April)',
      pay: '$18-$25/hour',
      location: 'In-Office (Indianapolis)',
      description:
        'Support tax preparers with client intake, document scanning, scheduling',
      requirements: [
        'Customer service experience',
        'Detail-oriented and organized',
        'Comfortable with technology',
        'Available weekdays and some Saturdays',
        'No tax experience required - we train!',
      ],
    },
    {
      title: 'Remote Tax Preparer (Work From Home)',
      type: 'Seasonal & Year-Round',
      pay: '$22-$40/hour',
      location: '100% Remote - Any US State',
      description:
        'Prepare taxes from home via video calls with clients nationwide. Serve clients in all 50 states.',
      requirements: [
        'IRS PTIN required',
        'Home office setup with reliable internet',
        'Comfortable with video conferencing (Zoom)',
        'Tax software experience (SupersonicFastCash, ProSeries, or similar)',
        'Available during tax season (Jan-April)',
        'Must be authorized to work in the USA',
        'Experience with multi-state returns preferred',
      ],
    },
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: 'Competitive Pay',
      description: '$20-$50/hour based on experience and credentials',
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Choose your hours - part-time or full-time available',
    },
    {
      icon: Home,
      title: 'Work From Home',
      description: 'Remote positions available - work from anywhere in Indiana',
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Advancement opportunities and continuing education support',
    },
    {
      icon: Users,
      title: 'Great Team',
      description: 'Supportive environment with experienced tax professionals',
    },
    {
      icon: Award,
      title: 'Bonuses',
      description: 'Performance bonuses and client referral incentives',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Careers" }]} />
      </div>
{/* Hero */}
      <section className="bg-white text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="inline-block bg-yellow-400 text-brand-green-900 px-4 py-2 rounded-full font-bold text-sm mb-4">
              NOW HIRING FOR TAX SEASON 2025
            </div>
            <h1 className="text-5xl font-bold mb-6">Join Our Tax Team</h1>
            <p className="text-2xl text-brand-green-100 mb-8">
              Earn $20-$50/hour as an PTIN-credentialed tax preparer. Work from home
              anywhere in the USA or in our Indianapolis offices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#apply"
                className="inline-block px-8 py-4 bg-yellow-400 text-brand-green-900 font-bold rounded-lg hover:bg-yellow-300 transition text-lg text-center"
              >
                Apply Now
              </Link>
              <a
                href="/support"
                className="inline-block px-8 py-4 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition text-lg border-2 border-white text-center"
              >
                Call 317-314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Bonus Program */}
      <section className="py-16 bg-yellow-50 border-y-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-block bg-yellow-400 text-brand-green-900 px-6 py-3 rounded-full font-bold text-lg mb-4">
              <DollarSign className="w-5 h-5 inline-block" /> REFERRAL BONUS
              PROGRAM
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Earn $50 Per Completed Return!
            </h2>
            <p className="text-xl text-black">
              Refer tax preparers and earn bonuses for every completed return
              they file
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-brand-green-600 mb-2">$50</div>
              <p className="text-lg font-bold">Per Completed Tax Return</p>
            </div>

            <div className="space-y-4 mb-6">
              <h3 className="font-bold text-lg">How It Works:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-black">
                <li>Refer a qualified tax preparer to join our team</li>
                <li>They get hired and start preparing returns</li>
                <li>You earn $50 for each completed return they file</li>
                <li>
                  No limit on earnings - the more they file, the more you earn!
                </li>
              </ol>
            </div>

            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-3">
                Stipulations & Requirements:
              </h3>
              <ul className="space-y-2 text-sm text-black">
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Referral must be hired and complete onboarding</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>
                    Bonus paid only for <strong>completed and accepted</strong>{' '}
                    tax returns
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Return must be e-filed and accepted by IRS/state</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Referral must remain employed for minimum 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>Bonuses paid monthly via direct deposit or check</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>
                    No bonus for rejected, amended, or incomplete returns
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-blue-600 font-bold">•</span>
                  <span>
                    Referrer must be current employee or approved partner
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-lg mb-3">Example Earnings:</h3>
              <div className="space-y-2 text-sm">
                <p>
                  • Your referral files <strong>10 returns/week</strong> ={' '}
                  <strong>$500/week</strong> for you
                </p>
                <p>
                  • Your referral files <strong>50 returns/month</strong> ={' '}
                  <strong>$2,500/month</strong> for you
                </p>
                <p>
                  • Your referral files <strong>200 returns/season</strong> ={' '}
                  <strong>$10,000/season</strong> for you
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-block px-8 py-4 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 transition"
              >
                Submit a Referral
              </a>
              <a
                href="/support"
                className="inline-block px-8 py-4 bg-white border-2 border-brand-green-600 text-brand-green-600 font-bold rounded-lg hover:bg-brand-green-50 transition"
              >
                Call 317-314-3757
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get PTIN & EFIN */}
      <section className="py-20 bg-brand-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              How to Become a Tax Preparer
            </h2>
            <p className="text-xl text-black">
              Don't have your PTIN yet? Here's how to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PTIN */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-brand-blue-900">
                Step 1: Get Your PTIN (Preparer Tax Identification Number)
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="font-bold mb-2">What is a PTIN?</p>
                  <p className="text-black">
                    A PTIN is required by the IRS for anyone who prepares or
                    assists in preparing federal tax returns for compensation.
                  </p>
                </div>

                <div>
                  <p className="font-bold mb-2">Cost:</p>
                  <p className="text-black">
                    $19.75 per year (renewed annually)
                  </p>
                </div>

                <div>
                  <p className="font-bold mb-2">How to Apply:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-black">
                    <li>
                      Go to{' '}
                      <a
                        href="https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-600 underline font-semibold"
                      >
                        IRS.gov/PTIN
                      </a>
                    </li>
                    <li>Click "Apply for PTIN Online"</li>
                    <li>Create an account or sign in</li>
                    <li>Complete the application (takes 15 minutes)</li>
                    <li>Pay $19.75 fee with credit card</li>
                    <li>Receive PTIN immediately upon approval</li>
                  </ol>
                </div>

                <div>
                  <p className="font-bold mb-2">Requirements:</p>
                  <ul className="list-disc pl-6 space-y-1 text-black">
                    <li>Valid Social Security Number or ITIN</li>
                    <li>Pass IRS suitability check</li>
                    <li>No recent tax compliance issues</li>
                  </ul>
                </div>
              </div>

              <a
                href="https://www.irs.gov/tax-professionals/ptin-requirements-for-tax-return-preparers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Apply for PTIN on IRS.gov →
              </a>
            </div>

            {/* EFIN */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-brand-blue-900">
                Step 2: EFIN (Electronic Filing Identification Number)
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="font-bold mb-2">What is an EFIN?</p>
                  <p className="text-black">
                    An EFIN allows you to electronically file tax returns with
                    the IRS. Required for professional tax preparers.
                  </p>
                </div>

                <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-4">
                  <p className="font-bold text-brand-green-900 mb-2">
                    <span className="text-slate-400 flex-shrink-0">•</span> Good News!
                  </p>
                  <p className="text-brand-green-800">
                    You DON'T need your own EFIN to work with us. We provide
                    EFIN access to all our tax preparers. You can file under our
                    company EFIN.
                  </p>
                </div>

                <div>
                  <p className="font-bold mb-2">If You Want Your Own EFIN:</p>
                  <ol className="list-decimal pl-6 space-y-2 text-black">
                    <li>
                      Complete IRS Form 8633 (Application to Participate in IRS
                      e-file)
                    </li>
                    <li>Submit fingerprints for background check</li>
                    <li>Pass IRS suitability check</li>
                    <li>Wait 45-60 days for approval</li>
                  </ol>
                </div>

                <div>
                  <p className="font-bold mb-2">Cost:</p>
                  <p className="text-black">
                    Free from IRS (fingerprinting costs ~$50)
                  </p>
                </div>

                <div>
                  <p className="font-bold mb-2">Requirements:</p>
                  <ul className="list-disc pl-6 space-y-1 text-black">
                    <li>Valid PTIN</li>
                    <li>Business address (not P.O. Box)</li>
                    <li>Pass fingerprint-based background check</li>
                    <li>Tax compliance check</li>
                  </ul>
                </div>
              </div>

              <a
                href="https://www.irs.gov/e-file-providers/become-an-authorized-e-file-provider"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full text-center px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
              >
                Learn More About EFIN →
              </a>
            </div>
          </div>

          {/* Additional Training */}
          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Step 3: Get Trained (Optional but Recommended)
            </h3>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold mb-3">
                  IRS Annual Filing Season Program
                </h4>
                <p className="text-black mb-3">
                  Complete 18 hours of continuing education from IRS-approved
                  providers
                </p>
                <p className="text-sm text-black">
                  <strong>Cost:</strong> $100-$300
                  <br />
                  <strong>Time:</strong> Self-paced online
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-3">Enrolled Agent (EA)</h4>
                <p className="text-black mb-3">
                  Pass IRS Special Enrollment Examination (SEE) - 3 parts
                </p>
                <p className="text-sm text-black">
                  <strong>Cost:</strong> $206 per part
                  <br />
                  <strong>Time:</strong> 3-6 months study
                </p>
              </div>

              <div>
                <h4 className="font-bold mb-3">
                  CPA (Certified Public Accountant)
                </h4>
                <p className="text-black mb-3">
                  Pass CPA exam and meet state requirements
                </p>
                <p className="text-sm text-black">
                  <strong>Cost:</strong> $1,000+
                  <br />
                  <strong>Time:</strong> 1-2 years
                </p>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="font-bold mb-2">
                <Lightbulb className="w-5 h-5 inline-block" /> We Provide Free
                Training!
              </p>
              <p className="text-black">
                Even if you don't have formal credentials, we offer free tax
                preparation training for new hires. You'll learn:
              </p>
              <ul className="list-disc pl-6 mt-2 text-black">
                <li>Tax software (SupersonicFastCash, ProSeries)</li>
                <li>Common tax forms (W-2, 1099, Schedule C)</li>
                <li>Deductions and credits</li>
                <li>Client communication</li>
                <li>IRS compliance and ethics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Work With Us?</h2>
            <p className="text-xl text-black">
              Better pay, better flexibility, better culture than H&R Block or
              Jackson Hewitt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="bg-white rounded-xl p-8 shadow-lg text-center"
                >
                  <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-brand-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-black">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-xl text-black">
              Find the perfect role for your skills and schedule
            </p>
          </div>

          <div className="space-y-8">
            {positions.map((position) => (
              <div
                key={position.title}
                className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-brand-green-600 transition"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="px-3 py-2 bg-brand-green-100 text-brand-green-700 rounded-full font-semibold">
                        {position.type}
                      </span>
                      <span className="px-3 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full font-semibold">
                        {position.location}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <div className="text-3xl font-bold text-brand-green-600">
                      {position.pay}
                    </div>
                  </div>
                </div>

                <p className="text-black mb-6">{position.description}</p>

                <div className="mb-6">
                  <h4 className="font-bold mb-3">Requirements:</h4>
                  <ul className="space-y-2">
                    {position.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span className="text-black">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="#apply"
                  className="inline-block px-6 py-3 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 transition"
                >
                  Apply for This Position
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison vs Competitors */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How We Compare</h2>
            <p className="text-xl text-black">
              See why tax professionals choose us over H&R Block, Jackson
              Hewitt, and Liberty Tax
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-lg">
              <thead className="bg-brand-green-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Feature</th>
                  <th className="px-6 py-4 text-center">
                    Supersonic Fast Cash
                  </th>
                  <th className="px-6 py-4 text-center">H&R Block</th>
                  <th className="px-6 py-4 text-center">Jackson Hewitt</th>
                  <th className="px-6 py-4 text-center">Liberty Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-6 py-4 font-semibold">Hourly Pay</td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    $20-$50
                  </td>
                  <td className="px-6 py-4 text-center">$12-$25</td>
                  <td className="px-6 py-4 text-center">$13-$22</td>
                  <td className="px-6 py-4 text-center">$12-$20</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Work From Home</td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <span className="text-slate-400 flex-shrink-0">•</span> Yes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Limited
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Limited
                  </td>
                  <td className="px-6 py-4 text-center">
                    <XCircle className="w-5 h-5 inline-block" /> No
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Flexible Schedule</td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <span className="text-slate-400 flex-shrink-0">•</span> Yes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Limited
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Limited
                  </td>
                  <td className="px-6 py-4 text-center">
                    <XCircle className="w-5 h-5 inline-block" /> No
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold">
                    Performance Bonuses
                  </td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <span className="text-slate-400 flex-shrink-0">•</span> Yes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Sometimes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Sometimes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <XCircle className="w-5 h-5 inline-block" /> Rare
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold">Year-Round Work</td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <span className="text-slate-400 flex-shrink-0">•</span> Available
                  </td>
                  <td className="px-6 py-4 text-center">
                    <AlertTriangle className="w-5 h-5 inline-block" /> Limited
                  </td>
                  <td className="px-6 py-4 text-center">
                    <XCircle className="w-5 h-5 inline-block" /> Seasonal Only
                  </td>
                  <td className="px-6 py-4 text-center">
                    <XCircle className="w-5 h-5 inline-block" /> Seasonal Only
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 font-semibold">Training Provided</td>
                  <td className="px-6 py-4 text-center text-brand-green-600 font-bold">
                    <span className="text-slate-400 flex-shrink-0">•</span> Free
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-slate-400 flex-shrink-0">•</span> Yes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-slate-400 flex-shrink-0">•</span> Yes
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-slate-400 flex-shrink-0">•</span> Yes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Apply Now</h2>
            <p className="text-xl text-black">
              Join our team for tax season 2025. We're hiring now!
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-xl p-12 text-center">
            <p className="text-xl text-black mb-8">
              Ready to join our team? Complete our online application to get
              started.
            </p>
            <Link
              href="/supersonic-fast-cash/careers/apply"
              className="inline-block bg-brand-green-600 text-white px-12 py-4 rounded-lg font-bold text-lg hover:bg-brand-green-700 transition"
            >
              Complete Application Form
            </Link>
            <p className="text-sm text-black mt-6">
              Application takes approximately 5-10 minutes to complete
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-black">
              Questions? Contact us at{' '}
              <a
                href="/support"
                className="text-brand-green-600 font-bold underline"
              >
                317-314-3757
              </a>{' '}
              or use{' '}
              <a
                href="/contact"
                className="text-brand-green-600 font-bold underline"
              >
                our contact form
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
