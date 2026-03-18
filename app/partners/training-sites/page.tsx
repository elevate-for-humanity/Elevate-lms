import { Metadata } from 'next';
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
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  getActivePartners,
  getPartnersByCategory,
  getCategoriesWithPartners,
  PARTNER_CATEGORIES,
  type PartnerCategory,
  type TrainingPartner,
} from '@/data/training-partners';

const SITE_URL = 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Employer Partners & Training Sites | Elevate for Humanity',
  description:
    'Approved employer training sites where Elevate for Humanity students complete hands-on training, OJT hours, clinical rotations, and apprenticeship placements.',
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

function PartnerCard({ partner }: { partner: TrainingPartner }) {
  const Icon = CATEGORY_ICONS[partner.category];
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">{partner.name}</h3>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span>{partner.city}, {partner.state}</span>
          </div>
          {partner.description && (
            <p className="text-xs text-slate-600 mt-1.5">{partner.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {partner.programs.map((program) => (
              <span
                key={program}
                className="text-[10px] font-medium bg-brand-blue-50 text-brand-blue-700 px-2 py-0.5 rounded-full"
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

function CategorySection({ category }: { category: PartnerCategory }) {
  const partners = getPartnersByCategory(category);
  const meta = PARTNER_CATEGORIES[category];
  const Icon = CATEGORY_ICONS[category];

  if (partners.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-blue-700" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{meta.label}</h2>
          <p className="text-xs text-slate-500">{meta.trainingDescription}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} partner={partner} />
        ))}
      </div>
    </div>
  );
}

export default function TrainingSitesPage() {
  const activePartners = getActivePartners();
  const categoriesWithPartners = getCategoriesWithPartners();
  const hasPartners = activePartners.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Partners', href: '/partners' },
              { label: 'Training Sites' },
            ]}
          />
          <h1 className="text-3xl sm:text-4xl font-bold mt-4 mb-3">
            Employer Partners &amp; Training Sites
          </h1>
          <p className="text-slate-300 text-lg max-w-3xl">
            Hands-on training, OJT hours, and clinical rotations are completed at approved
            employer partner locations throughout Indiana.
          </p>
        </div>
      </section>

      {/* Training Model Context */}
      <section className="py-8 bg-brand-blue-50 border-b border-brand-blue-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <Monitor className="w-6 h-6 text-brand-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Classroom / RTI</h3>
                <p className="text-xs text-slate-600">Online via Elevate LMS</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Building2 className="w-6 h-6 text-brand-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Hands-On / OJT</h3>
                <p className="text-xs text-slate-600">At employer partner sites listed below</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Documented &amp; Verified</h3>
                <p className="text-xs text-slate-600">All sites operate under signed agreements</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Listings or Placeholder */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          {hasPartners ? (
            <>
              <p className="text-sm text-slate-600 mb-8">
                The following employers and training sites have active, documented agreements with
                Elevate for Humanity. Each site has been verified for licensing, supervision
                capability, and safety standards appropriate to the training program.
              </p>
              {categoriesWithPartners.map((category) => (
                <CategorySection key={category} category={category} />
              ))}
            </>
          ) : (
            /* Placeholder until partners are populated */
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Training Site Categories
              </h2>
              <p className="text-sm text-slate-600 mb-8">
                Elevate for Humanity partners with employers across multiple industries to provide
                hands-on training. All training sites operate under documented agreements including
                MOUs, training site agreements, OJT contracts, or clinical affiliation agreements.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {(Object.entries(PARTNER_CATEGORIES) as [PartnerCategory, typeof PARTNER_CATEGORIES[PartnerCategory]][]).map(
                  ([key, meta]) => {
                    const Icon = CATEGORY_ICONS[key];
                    return (
                      <div
                        key={key}
                        className="bg-white rounded-lg border border-slate-200 p-5"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <h3 className="font-semibold text-slate-900">{meta.label}</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{meta.description}</p>
                        <p className="text-xs text-slate-500 italic">{meta.trainingDescription}</p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Documentation Standards */}
      <section className="py-10 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            <FileCheck className="w-5 h-5 inline-block mr-2 text-brand-blue-600" />
            Partner Documentation Standards
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Every employer training site listed on this page operates under at least one of the
            following documented agreements with Elevate for Humanity:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { title: 'Memorandum of Understanding (MOU)', desc: 'Defines roles, responsibilities, and training scope.' },
              { title: 'Training Site Agreement', desc: 'Specifies supervision, safety, and competency standards.' },
              { title: 'RAPIDS Employer Registration', desc: 'DOL-linked employer for registered apprenticeship programs.' },
              { title: 'OJT Contract', desc: 'WIOA-compliant on-the-job training contract with wage reimbursement terms.' },
              { title: 'Clinical Affiliation Agreement', desc: 'Healthcare facility agreement for clinical rotations and externships.' },
              { title: 'Written Partnership Confirmation', desc: 'Documented confirmation of training role and active status.' },
            ].map((doc) => (
              <div key={doc.title} className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-1">{doc.title}</h3>
                <p className="text-xs text-slate-500">{doc.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Documentation is maintained on file and available for review by authorized regulatory
            agencies, workforce boards, and grant auditors upon request.
          </p>
        </div>
      </section>

      {/* Become a Partner CTA */}
      <section className="py-10 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-3">Become a Training Partner</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Employers, barbershops, healthcare facilities, and training organizations can partner
              with Elevate to host apprentices, provide OJT placements, or hire trained graduates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/partners/join"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-blue-700 font-bold rounded-lg hover:bg-white transition"
              >
                Partner With Us <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/programs/barber-apprenticeship/host-shops"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition"
              >
                Host a Barber Apprentice
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="py-8 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <Link href="/disclosures/training-delivery" className="text-brand-red-600 hover:underline font-medium">
              Training Delivery Disclosure
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/accreditation" className="text-brand-red-600 hover:underline font-medium">
              Approvals &amp; Credentials
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/employers" className="text-brand-red-600 hover:underline font-medium">
              For Employers
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/disclosures" className="text-brand-red-600 hover:underline font-medium">
              All Disclosures
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
