export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Consumer Disclosures | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Consumer disclosures for ${PLATFORM_DEFAULTS.orgName} Career and Technical Institute.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/consumer-disclosures' },
};

export default function ConsumerDisclosuresPage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-10">Consumer Disclosures</h1>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Employment Disclosure</h2>
            <p className="text-neutral-700 leading-8">
              {PLATFORM_DEFAULTS.orgName} does not guarantee employment, job placement, wage outcomes,
              externship placement, licensing approval, or certification issuance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Third-Party Certifications</h2>
            <p className="text-neutral-700 leading-8">
              Certain training programs may prepare participants for industry-recognized
              certifications administered by third-party organizations. Certification
              eligibility, testing requirements, examination fees, and issuance standards
              are controlled by the applicable certifying organization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Tuition &amp; Funding Disclosure</h2>
            <p className="text-neutral-700 leading-8">
              Tuition, fees, and funding availability vary by program, partnership, grant
              eligibility, sponsor participation, and student enrollment status.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Hybrid Training Model</h2>
            <p className="text-neutral-700 leading-8">
              Training may be delivered online, in-person, at employer partner locations,
              through apprenticeship sites, through community-based instruction, or through
              hybrid learning environments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Institutional Status</h2>
            <p className="text-neutral-700 leading-8">
              {PLATFORM_DEFAULTS.orgName} Career and Technical Institute is a workforce development
              and technical training organization. It is not a degree-granting college or
              university. Participation in training does not guarantee employment, licensure,
              certification issuance, wage outcomes, or job placement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Program Availability</h2>
            <p className="text-neutral-700 leading-8">
              Program availability, cohort schedules, funding eligibility, and enrollment
              capacity may vary. {PLATFORM_DEFAULTS.orgName} reserves the right to modify, postpone,
              or cancel programs based on enrollment, funding, or operational requirements.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
