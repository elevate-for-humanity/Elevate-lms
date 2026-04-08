
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, CreditCard } from 'lucide-react';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramPageLayout from '@/components/programs/ProgramPageLayout';
import type { ProgramPageConfig } from '@/components/programs/ProgramPageLayout';
import { InView } from '@/components/ui/InView';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { NHA_FEATURED_PROGRAMS, getBundleRetailPrice, showPaymentPlan } from '@/lib/testing/nha-pricing';

export const dynamic = 'force-static';
export const revalidate = 86400;

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Healthcare Training Programs | Free with WIOA | Indianapolis',
  description: 'CNA, Medical Assistant, Phlebotomy, and CPR certification programs. Free for eligible participants. Job placement included.',
  alternates: { canonical: `${SITE_URL}/programs/healthcare` },
  openGraph: {
    title: 'Healthcare Training Programs | Free with WIOA | Indianapolis',
    description: 'CNA, Medical Assistant, Phlebotomy, and CPR certification programs. Free for eligible participants. Job placement included.',
    url: `${SITE_URL}/programs/healthcare`,
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'Healthcare Training Programs | Free with WIOA | Indianapolis' }],
    type: 'website',
  },
};

const config: ProgramPageConfig = {
  pageKey: 'healthcare',

  title: 'Healthcare Programs',
  subtitle: 'Launch a career in healthcare. CNA and Medical Assistant are free with WIOA funding. Phlebotomy is self-pay with BNPL options available.',
  badge: 'Free with WIOA',
  badgeColor: 'green',

  duration: '4–16 weeks',
  cost: '$0 with WIOA funding',
  format: 'In-person, Indianapolis',
  credential: 'State & National Certifications',

  overview: 'Our healthcare programs prepare you for in-demand careers in nursing, medical assisting, phlebotomy, and emergency care. Each program includes classroom instruction, hands-on skills labs, and supervised clinical rotations at healthcare facilities. Graduates earn industry-recognized certifications and receive career placement assistance.',
  highlights: [
    'State-approved curricula meeting Indiana licensing requirements',
    'Supervised clinical rotations at healthcare facilities',
    'National and state certification exam prep included',
    'CPR/First Aid and BLS certification included in every program',
    'Job placement assistance through our employer network',
    'Scrubs, textbooks, and supplies provided with WIOA funding',
  ],
  overviewImage: '/images/pages/healthcare-hero.jpg',
  overviewImageAlt: 'Healthcare students in clinical training',

  salaryNumber: 42000,
  salaryLabel: 'Average starting salary across healthcare programs',
  salaryPrefix: '$',

  credentials: [
    'Indiana CNA License',
    'Certified Medical Assistant (CCMA)',
    'Certified Phlebotomy Technician (CPT)',
    'CPR/First Aid/BLS',
  ],

  careers: [
    { title: 'Certified Nursing Assistant', salary: '$32,000–$42,000' },
    { title: 'Medical Assistant', salary: '$36,000–$46,000' },
    { title: 'Phlebotomy Technician', salary: '$34,000–$44,000' },
    { title: 'Patient Care Technician', salary: '$34,000–$44,000' },
    { title: 'Home Health Aide', salary: '$28,000–$36,000' },
  ],

  steps: [
    { title: 'Apply Online', desc: 'Complete our application in about 5 minutes.' },
    { title: 'Check Funding', desc: 'Most healthcare programs are free through WIOA.' },
    { title: 'Background Check', desc: 'Healthcare programs require a background check and drug screen.' },
    { title: 'Start Training', desc: 'Begin classroom instruction and clinical rotations.' },
  ],

  faqs: [
    { question: 'Are healthcare programs really free?', answer: 'Yes, for eligible participants. WIOA funding covers tuition, textbooks, scrubs, supplies, and certification exam fees. You pay nothing out of pocket if you qualify.' },
    { question: 'Which healthcare program should I choose?', answer: 'CNA is the fastest path (4-6 weeks) and a great entry point. Medical Assistant is longer (12-16 weeks) but offers higher starting pay and more clinical responsibilities. Phlebotomy is 8-10 weeks and focused on blood draws. Talk to an advisor if you are unsure.' },
    { question: 'Do I need a background check?', answer: 'Yes. All healthcare programs require a background check and drug screen before clinical rotations. Having a record does not automatically disqualify you — we review each situation individually.' },
    { question: 'How soon can I start working?', answer: 'Most graduates begin working within 2-4 weeks of passing their certification exam. Our career services team connects you with hiring employers.' },
  ],

  applyHref: '/apply?program=healthcare',

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare Programs' },
  ],
};

// Maps nha-pricing.ts program keys to their /programs/healthcare/[slug] routes
const NHA_PROGRAM_SLUGS: Record<string, string> = {
  medicalAssistant:     'nha-medical-assistant',
  pharmacyTechnician:   'nha-pharmacy-technician',
  phlebotomy:           'nha-phlebotomy',
  billingAndCoding:     'nha-billing-coding',
};

const healthcarePrograms = [
  {
    title: 'CNA Certification',
    duration: '4–6 weeks',
    desc: 'Become a Certified Nursing Assistant. State exam prep and clinical hours included.',
    href: '/programs/cna',
    image: '/images/pages/comp-pathway-healthcare.jpg',
  },
  {
    title: 'Medical Assistant',
    duration: '12–16 weeks',
    desc: 'Clinical and administrative medical assisting. CCMA certification included.',
    href: '/programs/medical-assistant',
    image: '/images/pages/admin-health-hero.jpg',
  },
  {
    title: 'Phlebotomy Technician',
    duration: '8–10 weeks',
    desc: 'Venipuncture, specimen handling, and lab safety. NHA CPT certification included. Self-pay — BNPL available. Not currently on WorkOne ETPL funded list.',
    href: '/programs/phlebotomy',
    image: '/images/pages/certifications-page-1.jpg',
  },
  {
    title: 'CPR & First Aid',
    duration: '1 day',
    desc: 'American Heart Association CPR, First Aid, and AED certification.',
    href: '/programs/cpr-first-aid',
    image: '/images/pages/healthcare-sector.jpg',
  },
];

export default function Page() {
  return (
    <>
      <ProgramStructuredData program={{
        id: 'healthcare',
        name: 'Healthcare Training Programs',
        slug: 'healthcare',
        description: config.subtitle,
        duration_weeks: 16,
        price: 0,
        image_url: `${SITE_URL}/images/pages/comp-pathway-healthcare.jpg`,
        category: 'Healthcare',
        outcomes: config.credentials || [],
      }} />
      <ProgramPageLayout config={config}>
        {/* Healthcare-specific: program cards */}
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 border-t border-slate-100">
            <div className="max-w-5xl mx-auto px-6">
              <div className="text-center mb-10">
                <p className="text-brand-red-600 font-semibold text-sm uppercase tracking-wider mb-2">Choose Your Path</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Healthcare Programs</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {healthcarePrograms.map((prog, i) => (
                  <ScrollReveal key={prog.title} delay={i * 80} direction="up">
                    <Link
                      href={prog.href}
                      className="flex flex-col bg-white rounded-xl border-2 border-slate-200 hover:border-brand-red-400 hover:shadow-md transition-all group overflow-hidden"
                    >
                      <Image
                        src={prog.image}
                        alt={prog.title}
                        width={600}
                        height={400}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                       sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg text-slate-900">{prog.title}</span>
                          <span className="text-xs font-semibold text-brand-red-600 bg-brand-red-50 px-2 py-1 rounded-full">{prog.duration}</span>
                        </div>
                        <span className="text-sm text-black mb-4 flex-1">{prog.desc}</span>
                        <span className="text-brand-red-600 font-semibold text-sm group-hover:underline">
                          Learn More →
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        </InView>
        {/* NHA Training Partner Programs */}
        <InView animation="fade-up">
          <section className="py-14 lg:py-20 border-t border-slate-100 bg-slate-50">
            <div className="max-w-5xl mx-auto px-6">

              {/* Section header */}
              <div className="text-center mb-4">
                <p className="text-emerald-700 font-semibold text-sm uppercase tracking-wider mb-2">
                  NHA Certification Programs
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
                  Healthcare Career Training That Leads to Certification
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-base">
                  Get trained, certified, and job-ready for high-demand healthcare roles.
                  Flexible programs with exam prep and support included.
                </p>
              </div>
              <p className="text-center text-slate-500 text-sm mb-10">
                No experience required. Payment plans available.
              </p>

              {/* Featured program cards — lead with the 4 strongest */}
              <div className="grid sm:grid-cols-2 gap-6 mb-10">
                {NHA_FEATURED_PROGRAMS.map((program, i) => {
                  const bundlePrice  = getBundleRetailPrice(program);
                  const hasPayPlan   = showPaymentPlan(program);
                  const slug         = NHA_PROGRAM_SLUGS[program.key];

                  return (
                    <ScrollReveal key={program.key} delay={i * 80} direction="up">
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="bg-emerald-700 px-6 py-5">
                          <h3 className="font-extrabold text-white text-xl leading-tight">
                            {program.label} Program
                          </h3>
                          <p className="text-emerald-200 text-xs mt-1">{program.tagline}</p>
                        </div>

                        <div className="px-6 py-5 flex-1 flex flex-col">
                          {/* Price */}
                          {bundlePrice != null ? (
                            <div className="mb-4">
                              <p className="text-3xl font-extrabold text-slate-900">
                                Starting at ${bundlePrice}
                              </p>
                              {hasPayPlan && (
                                <p className="text-emerald-700 text-xs font-semibold mt-1 flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5" />
                                  Payment plans available
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-slate-500 text-sm mb-4">Contact us for pricing</p>
                          )}

                          {/* What's included */}
                          <ul className="space-y-2 mb-5 flex-1">
                            {[
                              'Certification exam preparation',
                              'Practice assessments',
                              'Exam attempt included',
                              'Learner support throughout',
                            ].map(item => (
                              <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>

                          <Link
                            href={slug ? `/programs/healthcare/${slug}` : '/contact?program=healthcare'}
                            className="flex items-center justify-center w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm"
                          >
                            View Program →
                          </Link>
                        </div>
                      </div>
                    </ScrollReveal>
                  );
                })}
              </div>

              {/* Trust strip */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="font-extrabold text-slate-900 text-lg mb-4 text-center">
                  Built for Real Career Outcomes
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    'Certification-focused training aligned with industry standards',
                    'Includes exam prep and learner support',
                    'Flexible online learning options',
                    'Designed for entry-level healthcare careers',
                    'Pathways to employment and advancement',
                    'No experience required to enroll',
                  ].map(point => (
                    <div key={point} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {point}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>
        </InView>

      </ProgramPageLayout>
    </>
  );
}
