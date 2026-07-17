export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Disclosures | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    `Important disclosures and disclaimers for users of the ${PLATFORM_DEFAULTS.orgName} platform.`,
};



const ADVICE_LIST = [
  { label: 'Legal advice', note: 'Consult a licensed attorney' },
  { label: 'Financial advice', note: 'Consult a licensed financial advisor' },
  { label: 'Tax advice', note: 'Consult a licensed tax professional' },
  { label: 'Compliance advice', note: 'Consult qualified compliance professionals' },
  { label: 'Medical advice', note: 'Consult licensed healthcare providers' },
];

const RESPONSIBILITY_LIST = [
  'How you implement and configure the platform',
  'The content you create and upload',
  'The accuracy of your data and records',
  'Compliance with all applicable laws and regulations',
  'Your interactions with students, staff, and third parties',
  'Your business decisions and outcomes',
  'Obtaining necessary licenses, permits, and approvals',
  'Training your staff to use the platform',
];

const RESULTS_FACTORS = [
  'Your implementation quality',
  'Your content and curriculum',
  'Your marketing and recruitment',
  'Your staff capabilities',
  'Your local market conditions',
  'Economic factors beyond anyone\'s control',
  'Regulatory changes',
  'Student effort and circumstances',
];

const THIRD_PARTY_LIST = [
  'The availability or performance of third-party services',
  'The accuracy of third-party content',
  'Your agreements with third parties',
  'Data shared with third parties through integrations you enable',
];

const AVAILABILITY_LIST = [
  '100% uptime or uninterrupted access',
  'That the platform will be error-free',
  'That all features will always be available',
  'That the platform will meet all your specific requirements',
];

const FUNDING_LIST = [
  'We do not guarantee funding approval',
  'We do not guarantee continued funding',
  'You are responsible for meeting all funding requirements',
  'You are responsible for accurate reporting to funders',
  'We are not a party to your funding agreements',
];

const ACKNOWLEDGMENT_LIST = [
  'You have read and understood these disclosures',
  'You accept that no outcomes are guaranteed',
  'You are responsible for your own implementation and results',
  'You will seek qualified professional advice for legal, financial, and compliance matters',
  'You understand this is a software license, not a partnership or service agreement',
];

const SECTIONS = [
  {
    num: '1',
    title: 'What We Are',
    content: (
      <p className="text-slate-700 text-sm leading-relaxed">
        {PLATFORM_DEFAULTS.orgName} is a <strong>workforce development institute</strong> and <strong>DOL Registered Apprenticeship Sponsor</strong> providing funded career training to people facing barriers to employment. We deliver instruction, coordinate employer-based hands-on training, and connect participants with workforce funding. We are not a traditional campus-based institution.
      </p>
    ),
  },
  {
    num: '2',
    title: 'No Professional Advice',
    content: (
      <>
        <p className="text-slate-700 text-sm mb-4">Nothing on this platform constitutes:</p>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {ADVICE_LIST.map(({ label, note }) => (
            <div key={label} className="grid sm:grid-cols-[1fr_1.5fr] gap-0">
              <div className="px-4 py-3 sm:border-r border-slate-100 bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">{label}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-slate-600">{note}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3">Any information, templates, or tools provided are for general informational purposes only and should not be relied upon as professional advice.</p>
      </>
    ),
  },
  {
    num: '3',
    title: 'Your Responsibility',
    content: (
      <>
        <p className="text-slate-700 text-sm mb-4">You are solely responsible for:</p>
        <ul className="grid sm:grid-cols-2 gap-2">
          {RESPONSIBILITY_LIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '4',
    title: 'Results Disclaimer',
    content: (
      <>
        <p className="text-slate-700 text-sm mb-4">Any examples, case studies, or testimonials shown are for illustrative purposes only. They represent individual results and are not guarantees of future performance. Factors that affect results include:</p>
        <ul className="grid sm:grid-cols-2 gap-2">
          {RESULTS_FACTORS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '5',
    title: 'Third-Party Services',
    content: (
      <>
        <p className="text-slate-700 text-sm mb-4">The platform may integrate with or link to third-party services. We are not responsible for:</p>
        <ul className="space-y-2">
          {THIRD_PARTY_LIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '6',
    title: 'Platform Availability',
    content: (
      <>
        <p className="text-slate-700 text-sm mb-4">While we strive for high availability, we do not guarantee:</p>
        <ul className="space-y-2">
          {AVAILABILITY_LIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '7',
    title: 'Funding and Grants',
    content: (
      <>
        <p className="text-slate-700 text-sm mb-4">If you use the platform in connection with government funding (WIOA, grants, etc.):</p>
        <ul className="space-y-2">
          {FUNDING_LIST.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    num: '8',
    title: 'No Partnership',
    content: (
      <p className="text-slate-700 text-sm leading-relaxed">
        Using this platform does not make you a partner, affiliate, representative, or agent of {PLATFORM_DEFAULTS.orgName}. You are a customer licensing software. Nothing more.
      </p>
    ),
  },
];

export default async function DisclosuresPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Disclosures' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-extrabold mb-3 leading-tight">Disclosures</h1>
          <p className="text-slate-400 text-sm">Version 1.0 · Effective January 22, 2026</p>
        </div>
      </section>

      {/* No guarantees banner */}
      <section className="bg-brand-red-50 border-b border-brand-red-200 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-brand-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-brand-red-800 text-sm mb-1">No Guarantees</p>
            <p className="text-brand-red-700 text-sm leading-relaxed">
              We do not guarantee any outcomes. This includes but is not limited to: job placement, income levels, certification pass rates, funding approval, enrollment numbers, revenue, or business success. Your results depend entirely on how you implement and use the platform.
            </p>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-8 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
            These disclosures clarify what the {PLATFORM_DEFAULTS.orgName} platform is and is not. Please read carefully before using the platform or purchasing a license.
          </p>
        </div>
      </section>

      {/* Sections */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {SECTIONS.map(({ num, title, content }) => (
          <section key={num} className="scroll-mt-20" id={`section-${num}`}>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {num}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            </div>
            {content}
          </section>
        ))}
      </div>

      {/* Acknowledgment */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3 mb-6">
            <span className="w-6 h-6 rounded-full bg-brand-blue-600 inline-block flex-shrink-0 shrink-0 mt-0.5" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-900">Acknowledgment</h2>
          </div>
          <p className="text-slate-600 text-sm mb-5">By using the {PLATFORM_DEFAULTS.orgName} platform, you acknowledge that:</p>
          <ul className="space-y-3 mb-8">
            {ACKNOWLEDGMENT_LIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-2 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
            <Link href="/legal/eula" className="text-sm text-brand-blue-600 hover:underline font-medium">EULA</Link>
            <Link href="/legal" className="text-sm text-brand-blue-600 hover:underline font-medium">Terms of Service</Link>
            <Link href="/legal/acceptable-use" className="text-sm text-brand-blue-600 hover:underline font-medium">Acceptable Use Policy</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
