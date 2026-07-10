export const revalidate = 3600;

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Monitor, Wrench, HeartHandshake, Building2, MapPin, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

export const metadata: Metadata = {
  title: `Training Delivery Model Disclosure | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    `How ${PLATFORM_DEFAULTS.orgName} delivers training: online didactic instruction via LMS, hands-on training at approved employer partner sites, and virtual support services.`,
  alternates: { canonical: `${SITE_URL}/disclosures/training-delivery` },
};

const DELIVERY_COMPONENTS = [
  {
    Icon: Monitor,
    iconBg: 'bg-brand-blue-100',
    iconColor: 'text-brand-blue-700',
    title: 'Didactic / Classroom Instruction — Online',
    body: [
      'All Related Technical Instruction (RTI) and classroom-equivalent coursework is delivered online through the Elevate Learning Management System (LMS). This includes curriculum modules, video instruction, quizzes, assessments, and progress tracking.',
      'Students access course materials on their own schedule with structured deadlines. Instructor support is available via the platform, email, and scheduled virtual sessions.',
    ],
  },
  {
    Icon: Wrench,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-700',
    title: 'Hands-On / OJT Training — Employer Partner Sites',
    body: [
      'Practical, hands-on training and On-the-Job Training (OJT) hours are completed at approved employer partner locations. Training sites are selected based on program requirements, licensing standards, and geographic accessibility.',
    ],
    table: [
      { program: 'Barber & Cosmetology Apprenticeships', site: 'Licensed partner barbershops and salons in the Indianapolis metro area' },
      { program: 'Healthcare (CNA, Phlebotomy, Medical Assistant)', site: 'Partner clinical facilities, nursing homes, and medical offices' },
      { program: 'CDL / Commercial Driving', site: 'Partner driving schools with yard and road training facilities' },
      { program: 'Skilled Trades (HVAC, Electrical, Welding, Plumbing)', site: 'Employer worksites and partner training labs' },
      { program: 'IT, Business & Tax Preparation', site: 'Delivered fully online — no physical training site required' },
    ],
  },
  {
    Icon: HeartHandshake,
    iconBg: 'bg-brand-green-100',
    iconColor: 'text-brand-green-700',
    title: 'Support Services — Virtual & In-Person',
    body: [
      'Career counseling, case management, funding navigation, and advising are available virtually (video, phone, chat) and in-person by appointment. WIOA-funded participants also work with their assigned WorkOne career advisor. Supportive services (transportation assistance, childcare support, supplies) are coordinated through applicable funding programs.',
    ],
  },
  {
    Icon: Building2,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-700',
    title: 'Administrative Office, Testing & Hands-On Training',
    body: [
      `${PLATFORM_DEFAULTS.orgName} maintains this location for administrative operations, enrollment support, scheduled meetings, authorized proctored testing, and approved hands-on training activities. Services at this site are available by appointment only. This is not a walk-in location.`,
    ],
    address: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240',
  },
];

const CREDENTIALING_AUTHORITIES = [
  'Indiana Professional Licensing Agency (PLA)',
  'Indiana State Department of Health (ISDH)',
  'Indiana Bureau of Motor Vehicles (BMV)',
  'U.S. Environmental Protection Agency (EPA)',
  'Occupational Safety & Health Administration (OSHA)',
  'National Center for Construction Education (NCCER)',
  'American Welding Society (AWS)',
  'Certiport / Pearson VUE',
];

const PARTNER_DOCS = [
  'Memoranda of Understanding (MOUs) with employer partners',
  'Training site agreements specifying supervision, safety, and competency standards',
  'RAPIDS-linked employer registrations for apprenticeship programs',
  'OJT contracts for WIOA-funded placements',
  'Clinical affiliation agreements for healthcare programs',
];

export default function TrainingDeliveryDisclosure() {
  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Home', href: '/' },
            { label: 'Disclosures', href: '/legal/disclosures' },
            { label: 'Training Delivery Model' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-700 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-blue-200 text-xs font-bold uppercase tracking-widest mb-3">
            Institutional Disclosure
          </p>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">Training Delivery Model</h1>
          <p className="text-brand-blue-100 text-lg max-w-2xl leading-relaxed">
            How ${PLATFORM_DEFAULTS.orgName} delivers workforce training across all programs.
          </p>
        </div>
      </section>

      {/* Institutional statement */}
      <section className="bg-brand-blue-50 border-b border-brand-blue-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 bg-white rounded-xl border border-brand-blue-200 p-6">
            <ShieldCheck className="w-6 h-6 text-brand-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900 text-sm mb-2">Institutional Disclosure</p>
              <p className="text-slate-700 text-sm leading-relaxed">
                {PLATFORM_DEFAULTS.orgName} (operating as 2Exclusive LLC-S, DBA {PLATFORM_DEFAULTS.orgName} Career &amp; Training Institute) is a <strong>workforce training institute</strong> and <strong>DOL Registered Apprenticeship Sponsor</strong> (RAPIDS: 2025-IN-132301). We are an Indiana DWD-approved training provider listed on the Eligible Training Provider List (ETPL). Elevate is <strong>not a traditional campus-based institution</strong>. Training is delivered through a combination of online instruction and employer-based hands-on learning at approved partner sites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery components */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">How Training Is Delivered</h2>

          <div className="space-y-10">
            {DELIVERY_COMPONENTS.map(({ Icon, iconBg, iconColor, title, body, table, address }) => (
              <div key={title} className="flex gap-5">
                <div className={`flex-shrink-0 w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 mb-3">{title}</h3>
                  {body.map((para, i) => (
                    <p key={i} className="text-sm text-slate-600 leading-relaxed mb-3">{para}</p>
                  ))}
                  {table && (
                    <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Training Sites by Program Type</p>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {table.map(({ program, site }) => (
                          <div key={program} className="grid sm:grid-cols-[1fr_1.5fr] gap-0">
                            <div className="px-4 py-3 sm:border-r border-slate-100">
                              <p className="text-xs font-semibold text-slate-800">{program}</p>
                            </div>
                            <div className="px-4 py-3">
                              <p className="text-xs text-slate-600">{site}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {address && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Credential issuance */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Credential Issuance</h2>
          <p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Industry credentials and licenses are issued by recognized third-party certifying authorities — not by {PLATFORM_DEFAULTS.orgName}. Elevate issues program completion certificates documenting hours completed, competencies achieved, and program requirements met.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Credentialing Authorities</p>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {[CREDENTIALING_AUTHORITIES.slice(0, 4), CREDENTIALING_AUTHORITIES.slice(4)].map((col, ci) => (
                <ul key={ci} className="divide-y divide-slate-100">
                  {col.map((item) => (
                    <li key={item} className="px-5 py-3 text-sm text-slate-700">{item}</li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Funding disclosure */}
      <section className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Funding &amp; Tuition Disclosure</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>Important:</strong> Many Elevate programs may be available at no cost to eligible participants through federal and state workforce funding programs including WIOA, WRG (Workforce Ready Grant), and Job Ready Indy. Eligibility is determined by your local WorkOne career center, not by Elevate. Not all applicants will qualify for funded training. Self-pay options and payment plans are available for participants who do not qualify for workforce funding. See{' '}
              <Link href="/tuition-fees" className="text-amber-800 underline font-semibold">Tuition &amp; Fees</Link>{' '}
              for program-specific costs.
            </p>
          </div>
        </div>
      </section>

      {/* Employer partner documentation */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Employer Partner Documentation</h2>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            All employer training sites operate under documented agreements with {PLATFORM_DEFAULTS.orgName}. See our{' '}
            <Link href="/partners/training-sites" className="text-brand-blue-600 underline font-semibold">Employer Partners &amp; Training Sites</Link>{' '}
            page for current partner listings. Training site documentation includes:
          </p>
          <ul className="space-y-2">
            {PARTNER_DOCS.map((doc) => (
              <li key={doc} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-2 shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate-500 mt-4">
            Training site agreements are maintained on file and available for review by authorized regulatory agencies, workforce boards, and grant auditors upon request.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-blue-700 text-white px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Questions About Our Training Model?</h2>
            <p className="text-brand-blue-200 text-sm">Contact our enrollment team for details about specific program delivery, training sites, or funding eligibility.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-brand-blue-50 transition text-sm">
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/legal/disclosures" className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-slate-900 font-semibold rounded-lg hover:bg-white/10 transition text-sm">
              All Disclosures
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
