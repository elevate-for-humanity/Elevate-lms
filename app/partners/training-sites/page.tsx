export const revalidate = 3600;

import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Scissors,
  Stethoscope,
  Truck,
  Wrench,
  Monitor,
  Briefcase,
  Heart,
  MapPin,
  ArrowRight,
  Building2,
  FileCheck,
  Shield,
  CheckCircle,
  Users,
  ClipboardList,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  PARTNER_CATEGORIES,
  type PartnerCategory,
  type TrainingPartner,
} from '@/data/training-partners';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SITE_URL = PLATFORM_DEFAULTS.siteUrl;

export const metadata: Metadata = {
  title: 'Employer Partners & Training Sites',
  description:
    `Approved employer training sites where ${PLATFORM_DEFAULTS.orgName} students complete hands-on training, OJT hours, clinical rotations, and apprenticeship placements across Indiana.`,
  alternates: { canonical: `${SITE_URL}/partners/training-sites` },
};

const CATEGORY_ICONS: Record<PartnerCategory, typeof Scissors> = {
  barbershop: Scissors,
  healthcare: Stethoscope,
  cdl: Truck,
  'skilled-trades': Wrench,
  technology: Monitor,
  business: Briefcase,
  'social-services': Heart,
};

const WHAT_IS_A_TRAINING_SITE = [
  {
    icon: Building2,
    title: 'Real Workplaces',
    desc: 'Training sites are active businesses — barbershops, clinics, warehouses, construction firms, and tech companies — where students complete hands-on hours under licensed supervision.',
  },
  {
    icon: ClipboardList,
    title: 'Documented Agreements',
    desc: 'Every site operates under a signed MOU, OJT contract, or clinical affiliation agreement. No informal arrangements. All documentation is audit-ready for WIOA, DOL, and state agencies.',
  },
  {
    icon: Users,
    title: 'Supervised by Professionals',
    desc: 'On-site supervisors are licensed or credentialed in their field. They mentor students, sign off on competencies, and report progress back to Elevate.',
  },
  {
    icon: Shield,
    title: 'Verified & Approved',
    desc: 'Each site is reviewed for licensing, insurance, supervision capacity, and safety standards before students are placed. Sites are re-verified annually.',
  },
];

const PARTNER_BENEFITS = [
  'Access to pre-screened, motivated learners at no recruiting cost',
  'WIOA OJT wage reimbursement — up to 50% of trainee wages covered',
  'DOL RAPIDS registration for registered apprenticeship programs',
  'Tax credits available for qualifying employers (WOTC)',
  'Pathway to hire trained graduates before they enter the open market',
  'Elevate handles all compliance documentation and reporting',
];

function PartnerCard({ partner }: { partner: TrainingPartner }) {
  const Icon = CATEGORY_ICONS[partner.category];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-brand-blue-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">{partner.name}</h3>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>
              {partner.city}, {partner.state}
            </span>
          </div>
          {partner.description && (
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{partner.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {partner.programs.map((program) => (
              <span
                key={program}
                className="text-[10px] font-medium bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded-full border border-brand-blue-100"
              >
                {program}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  partners,
}: {
  category: PartnerCategory;
  partners: TrainingPartner[];
}) {
  const meta = PARTNER_CATEGORIES[category];
  const Icon = CATEGORY_ICONS[category];
  if (partners.length === 0) return null;
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-blue-700" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{meta.label}</h2>
          <p className="text-sm text-slate-600">{meta.trainingDescription}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} partner={partner} />
        ))}
      </div>
    </div>
  );
}

export default async function TrainingSitesPage() {
  let activePartners: TrainingPartner[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('training_partners')
      .select('name, category, training_role, city, state, notes, programs_list')
      .eq('status', 'active')
      .order('name');
    if (data && data.length > 0) {
      activePartners = data.map((r) => ({
        name: r.name,
        category: r.category as PartnerCategory,
        trainingRole: r.training_role,
        status: 'active' as const,
        city: r.city,
        state: r.state,
        documentation: [],
        programs: r.programs_list ?? [],
        description: r.notes ?? undefined,
      }));
    }
  } catch {
    // fall through to placeholder
  }

  const categoriesWithPartners = [...new Set(activePartners.map((p) => p.category))];
  const hasPartners = activePartners.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Partners', href: '/partners' },
              { label: 'Training Sites & Facilities' },
            ]}
          />
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: 'clamp(240px, 34vw, 390px)' }}
      >
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/apprenticeship-hero.webp"
          alt={`${PLATFORM_DEFAULTS.orgName} training sites and employer partners`}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw" placeholder="empty"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-900/80 via-brand-blue-800/40 to-brand-blue-900/60" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 pb-12 pt-20">
          <span className="inline-block bg-brand-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            Employer Partners · OJT Sites · Clinical Affiliates
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight drop-shadow-md">
            Training Sites &amp; Facilities
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl leading-relaxed drop-shadow">
            Elevate students complete hands-on training, OJT hours, clinical rotations, and
            apprenticeship placements at approved employer partner sites throughout Indiana. Every
            site operates under a documented agreement and meets our supervision and safety
            standards.
          </p>
        </div>
      </section>

      {/* What is a Training Site */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">What Is a Training Site?</h2>
            <p className="text-lg text-slate-700 max-w-2xl mx-auto">
              A training site is an approved employer location where Elevate students gain
              real-world experience under professional supervision. These are not simulated
              environments — students work alongside licensed professionals in active businesses.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHAT_IS_A_TRAINING_SITE.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-200"
                >
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-blue-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Training Model */}
      <section className="py-12 bg-brand-blue-50 border-y border-brand-blue-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-black text-slate-900 mb-8 text-center">
            How Training Is Delivered
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-brand-blue-200 flex gap-4">
              <Monitor className="w-8 h-8 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">
                  Related Technical Instruction (RTI)
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Online coursework delivered through Elevate's LMS. Covers theory, safety,
                  regulations, and credential prep. Completed on the student's schedule.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-brand-orange-200 flex gap-4">
              <Building2 className="w-8 h-8 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">On-the-Job Training (OJT)</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Hands-on hours completed at an approved employer training site. Students work
                  under a licensed supervisor and log hours toward their credential.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border border-brand-green-200 flex gap-4">
              <Shield className="w-8 h-8 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Competency Sign-Off</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Supervisors verify and sign off on specific skills as students demonstrate them.
                  Completed competencies are logged in Elevate's system and submitted to
                  credentialing bodies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Listings */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {hasPartners ? (
            <>
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">Active Training Sites</h2>
                <p className="text-slate-600">
                  The following employers and training sites have active, documented agreements with
                  {PLATFORM_DEFAULTS.orgName}. Each site has been verified for licensing, supervision
                  capability, and safety standards.
                </p>
              </div>
              {categoriesWithPartners.map((category) => (
                <CategorySection
                  key={category}
                  category={category}
                  partners={activePartners.filter((p) => p.category === category)}
                />
              ))}
            </>
          ) : (
            <div>
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-900 mb-2">
                  Training Site Categories
                </h2>
                <p className="text-slate-600 max-w-3xl">
                  Elevate partners with employers across multiple industries to provide hands-on
                  training. All sites operate under documented agreements including MOUs, OJT
                  contracts, and clinical affiliation agreements. Contact us to request the current
                  list of active sites for a specific program.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(
                  Object.entries(PARTNER_CATEGORIES) as [
                    PartnerCategory,
                    (typeof PARTNER_CATEGORIES)[PartnerCategory],
                  ][]
                ).map(([key, meta]) => {
                  const Icon = CATEGORY_ICONS[key];
                  return (
                    <div
                      key={key}
                      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-brand-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">{meta.label}</h3>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                        {meta.description}
                      </p>
                      <p className="text-xs text-slate-500 italic">{meta.trainingDescription}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Become a Partner */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Become a Training Site</h2>
              <p className="text-slate-700 leading-relaxed mb-6">
                Employers, barbershops, healthcare facilities, and trade businesses can partner with
                Elevate to host apprentices, provide OJT placements, and hire trained graduates.
                There is no cost to become a training site partner.
              </p>
              <ul className="space-y-3 mb-8">
                {PARTNER_BENEFITS.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/partners/apply"
                  className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Partner With Us <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/programs/barber-apprenticeship/host-shops"
                  className="inline-flex items-center gap-2 border border-slate-300 hover:border-brand-blue-400 text-slate-700 font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Host a Barber Apprentice
                </Link>
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/pages/employer-handshake.webp"
                alt="Employer partnership with {PLATFORM_DEFAULTS.orgName}"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw" placeholder="empty"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Standards */}
      <section className="py-16 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <FileCheck className="w-6 h-6 text-brand-blue-600" />
            <h2 className="text-2xl font-black text-slate-900">Partner Documentation Standards</h2>
          </div>
          <p className="text-slate-700 mb-8 max-w-3xl">
            Every employer training site operates under at least one of the following documented
            agreements with {PLATFORM_DEFAULTS.orgName}. Documentation is maintained on file and available
            for review by authorized regulatory agencies, workforce boards, and grant auditors.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Memorandum of Understanding (MOU)',
                desc: 'Defines roles, responsibilities, and training scope between Elevate and the employer.',
              },
              {
                title: 'Training Site Agreement',
                desc: 'Specifies supervision requirements, safety standards, and competency verification procedures.',
              },
              {
                title: 'RAPIDS Employer Registration',
                desc: 'DOL-linked employer registration for registered apprenticeship programs — required for all apprenticeship OJT sites.',
              },
              {
                title: 'OJT Contract',
                desc: 'WIOA-compliant on-the-job training contract with wage reimbursement terms and performance benchmarks.',
              },
              {
                title: 'Clinical Affiliation Agreement',
                desc: 'Healthcare facility agreement governing clinical rotations, supervision ratios, and liability for CNA, MA, and phlebotomy students.',
              },
              {
                title: 'Written Partnership Confirmation',
                desc: 'Documented confirmation of training role, active status, and supervisor credentials for all other site types.',
              },
            ].map((doc) => (
              <div
                key={doc.title}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow"
              >
                <h3 className="font-bold text-slate-900 text-sm mb-2">{doc.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-8 border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            {[
              { label: 'Training Delivery Disclosure', href: '/disclosures/training-delivery' },
              { label: 'Approvals & Credentials', href: '/accreditation' },
              { label: 'For Employers', href: '/employer/dashboard' },
              { label: 'All Disclosures', href: '/legal/disclosures' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-brand-blue-600 hover:underline font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
