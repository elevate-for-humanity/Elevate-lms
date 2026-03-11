export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import StateLicensingDropdown from '@/components/programs/StateLicensingDropdown';
import { PHLEBOTOMY } from '@/data/programs/phlebotomy';
import { PHLEBOTOMY_STATE_LICENSING } from '@/data/state-licensing';

const p = PHLEBOTOMY;

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/phlebotomy' },
};

export default function PhlebotomyPage() {
  return (
    <>
      <ProgramStructuredData
        program={{
          id: p.slug,
          name: p.title,
          slug: p.slug,
          description: p.subtitle,
          duration_weeks: p.durationWeeks,
          price: parseInt(p.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: p.heroImage,
          category: p.category,
          outcomes: p.outcomes.map((o) => o.statement),
        }}
      />
      <ProgramDetailPage program={p} />

      {/* State licensing section */}
      <section className="py-14 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Can You Work as a Phlebotomist in Your State?</h2>
            <p className="text-slate-500 text-base max-w-xl mx-auto">
              Most states accept national certification (NHA CPT) without additional state licensure.
              A few states require their own license. Check yours below.
            </p>
          </div>
          <StateLicensingDropdown states={PHLEBOTOMY_STATE_LICENSING} programName="Phlebotomy Technician" />
        </div>
      </section>
    </>
  );
}
