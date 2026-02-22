export const dynamic = 'force-static';
export const revalidate = 86400;

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Clock, DollarSign, Award, CheckCircle, Users, BookOpen, Calculator, TrendingUp, Briefcase , ArrowRight, Phone } from 'lucide-react';
import { CredentialsOutcomes } from '@/components/programs/CredentialsOutcomes';
import PathwayDisclosure from '@/components/PathwayDisclosure';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Financial Literacy & Bookkeeping | Certiport Certified | Indianapolis',
  description:
    'Earn Intuit Certified Bookkeeping Professional and QuickBooks Certified User credentials. 10-week program in Indianapolis. WorkOne-eligible. Average salary $47,944.',
  keywords:
    'bookkeeping training, QuickBooks certification, Intuit certified bookkeeping, financial literacy program, bookkeeping course Indianapolis, Certiport certification, accounting clerk training, WorkOne funded training',
  alternates: {
    canonical: `${SITE_URL}/programs/tax-preparation`,
  },
};

export default function Page() {
  return (
    <>
    <ProgramStructuredData program={{
      id: 'tax-preparation',
      name: 'Financial Literacy & Bookkeeping — Intuit Certified',
      slug: 'tax-preparation',
      description: 'Earn Intuit Certified Bookkeeping Professional and QuickBooks Certified User credentials. 10-week program.',
      duration_weeks: 10,
      price: 4950,
      image_url: `${SITE_URL}/images/programs-hq/tax-preparation.jpg`,
      category: 'Business',
      outcomes: ['Intuit Certified Bookkeeping Professional (Certiport/Intuit)', 'Intuit QuickBooks Certified User (Certiport/Intuit)', 'Certificate of Completion'],
    }} />
    <div className="min-h-screen bg-white">
      <ProgramHeroBanner videoSrc="/videos/it-technology.mp4" />
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: 'Financial Literacy & Bookkeeping' },
        ]}
      />

      {/* Hero */}
      <section className="relative w-full -mt-[72px]">
        <div className="relative min-h-[70vh] w-full overflow-hidden">
          <Image
            src="/images/business/program-tax-preparation.jpg"
            alt="Financial Literacy and Bookkeeping Training"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
          <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
            <div className="max-w-5xl mx-auto px-6 text-center text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/30">
                <Award className="w-6 h-6 text-brand-blue-300 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  Certiport / Intuit Certified
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black mb-6">
                Financial Literacy & Bookkeeping
              </h1>
              <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto">
                Earn two industry-recognized Intuit certifications in 10 weeks.
                Bookkeeping clerks earn an average of $47,944/year in Indiana.
              </p>
              <p className="text-lg mb-8 text-brand-blue-200 font-semibold">
                DWD Top Jobs: 3-Star Occupation | WorkOne Eligible | SOC 43-3031
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/apply?program=tax-preparation"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-blue-600 font-bold rounded-xl hover:bg-gray-100 transition text-lg shadow-lg"
                >
                  Apply Now
                </Link>
                <a
                  href="https://www.indianacareerconnect.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-transparent text-white font-bold rounded-xl hover:bg-white/10 transition text-lg border-2 border-white"
                >
                  Schedule at WorkOne
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar videoSrc="/videos/avatars/tax-guide.mp4" title="Financial Literacy Program Guide" />

      {/* Pathway Disclosure */}
      <PathwayDisclosure programName="Financial Literacy & Bookkeeping" programSlug="tax-preparation" />

      {/* Why Financial Literacy & Bookkeeping */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Financial Literacy & Bookkeeping?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-brand-blue-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">3-Star Top Job</h3>
              <p className="text-slate-600">DWD high-demand occupation in Indiana</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-brand-blue-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">$47,944 Avg Salary</h3>
              <p className="text-slate-600">Indiana average for bookkeeping clerks</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-brand-blue-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">Every Business Needs One</h3>
              <p className="text-slate-600">Bookkeepers work in every industry</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-brand-blue-600 flex-shrink-0" />
              </div>
              <h3 className="font-bold text-lg mb-2">2 Certifications</h3>
              <p className="text-slate-600">Intuit Bookkeeping + QuickBooks Certified User</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications You Earn */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Certifications You Earn
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-brand-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="w-8 h-8 text-brand-blue-600" />
                <h3 className="text-xl font-bold text-brand-blue-900">
                  Intuit Certified Bookkeeping Professional
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                Validates foundational bookkeeping knowledge aligned with industry standards.
                Issued by Certiport/Intuit.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Accounts payable & receivable</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Payroll processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Financial statements & reporting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>General ledger management</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-brand-green-200">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-8 h-8 text-brand-green-600" />
                <h3 className="text-xl font-bold text-brand-green-900">
                  Intuit QuickBooks Certified User
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                Demonstrates proficiency in QuickBooks — the most widely used
                small business accounting software. Issued by Certiport/Intuit.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>QuickBooks setup & navigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Invoicing & billing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Bank reconciliation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span>Reports & financial analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Training Path */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How to Enroll</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Apply Online', desc: 'Complete our simple application' },
              { num: 2, title: 'Register at Indiana Career Connect', desc: 'Verify WIOA funding eligibility' },
              { num: 3, title: 'Orientation', desc: 'Attend program orientation' },
              { num: 4, title: 'Start Training', desc: 'Begin your bookkeeping career' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Ready to Start Your Bookkeeping Career?</h2>
          <p className="text-xl text-slate-300 mb-8">10 weeks. Two Intuit certifications. WorkOne funding available.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply?program=tax-preparation" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> Get Help Online
            </a>
          </div>
          <p className="mt-6 text-slate-400">Call <a href="tel:3173143757" className="font-bold underline text-white">317-314-3757</a></p>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Program Details</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Clock className="w-8 h-8 text-brand-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Duration</h3>
              <p className="text-slate-600">10 weeks</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <DollarSign className="w-8 h-8 text-brand-green-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Tuition</h3>
              <p className="text-slate-600">$4,950 (WorkOne funding available)</p>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Format</h3>
              <p className="text-slate-600">In-person at Indianapolis Training Center</p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Career Outcomes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Jobs You Qualify For</h3>
              <ul className="space-y-3">
                {[
                  { title: 'Bookkeeping Clerk', salary: '$38K-$58K' },
                  { title: 'Accounts Payable Specialist', salary: '$36K-$52K' },
                  { title: 'Accounts Receivable Clerk', salary: '$35K-$50K' },
                  { title: 'Payroll Clerk', salary: '$38K-$55K' },
                  { title: 'Full-Charge Bookkeeper', salary: '$42K-$62K' },
                  { title: 'QuickBooks Specialist', salary: '$40K-$58K' },
                ].map((job) => (
                  <li key={job.title} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="font-medium">{job.title}</span>
                    <span className="text-brand-green-600 font-bold text-sm">{job.salary}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Industries Hiring</h3>
              <ul className="space-y-3">
                {[
                  'Healthcare offices & clinics',
                  'Construction & trades companies',
                  'Nonprofits & churches',
                  'Small businesses (every type)',
                  'CPA & accounting firms',
                  'Property management companies',
                  'Government agencies',
                  'Self-employed / freelance bookkeeping',
                ].map((industry) => (
                  <li key={industry} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{industry}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      

      {/* Credentials & Outcomes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <CredentialsOutcomes
            programName="Financial Literacy & Bookkeeping"
            partnerCertifications={[
              'Intuit Certified Bookkeeping Professional (issued by Certiport/Intuit)',
              'Intuit QuickBooks Certified User (issued by Certiport/Intuit)',
              'Microsoft 365 Fundamentals (issued by Certiport/Microsoft)',
              'Certificate of Completion (issued by Elevate for Humanity)',
            ]}
            employmentOutcomes={[
              'Bookkeeping Clerk (SOC 43-3031)',
              'Accounts Payable/Receivable Specialist',
              'Payroll Clerk',
              'Full-Charge Bookkeeper',
              'QuickBooks Specialist',
              'Freelance Bookkeeper',
            ]}
          />
        </div>
      </section>
    </div>
    </>
  );
}
