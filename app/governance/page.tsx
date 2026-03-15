import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Governance & Program Structure | Elevate for Humanity',
  description: 'Institutional governance structure, apprenticeship sponsor role, program delivery model, and partner training site framework for Elevate for Humanity Career & Technical Institute.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/governance' },
};

export default function GovernancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[200px] sm:h-[260px] overflow-hidden">
        <Image src="/images/pages/governance-page-1.jpg" alt="Governance and program structure" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-white border-b border-slate-200 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Governance &amp; Program Structure</h1>
          <p className="text-slate-600 mt-2">Institutional oversight, program delivery model, and compliance framework.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Governance & Program Structure' }]} />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <p className="text-lg text-slate-700 leading-relaxed mb-10">
          Elevate for Humanity Career &amp; Technical Institute, a program of 2Exclusive LLC-S, operates under a centralized governance model that integrates apprenticeship sponsorship, workforce training, related technical instruction, and partner training site coordination within a single compliant institutional framework.
        </p>

        {/* Legal Entity and Institutional Identity */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Legal Entity and Institutional Identity</h2>
          <p className="text-slate-700 leading-relaxed mb-3">
            2Exclusive LLC-S is the governing legal entity and Registered Apprenticeship sponsor of record.
          </p>
          <p className="text-slate-700 leading-relaxed">
            Elevate for Humanity Career &amp; Technical Institute is the operating division and instructional provider delivering career and technical education, apprenticeship instruction, and workforce-aligned training programs.
          </p>
        </section>

        {/* Organizational Role Classification */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Organizational Role Classification</h2>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap align-top">Registered Apprenticeship Sponsor</td>
                  <td className="px-6 py-4 text-slate-700">2Exclusive LLC-S</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap align-top">Training Provider and Instructional Institution</td>
                  <td className="px-6 py-4 text-slate-700">Elevate for Humanity Career &amp; Technical Institute (DBA)</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap align-top">Workforce Intermediary and Program Coordinator</td>
                  <td className="px-6 py-4 text-slate-700">Elevate for Humanity Career &amp; Technical Institute</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap align-top">Employer and Training Sites</td>
                  <td className="px-6 py-4 text-slate-700">Licensed partner locations operating under formal training agreements</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Registered Apprenticeship Model */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Registered Apprenticeship Model</h2>
          <p className="text-slate-700 leading-relaxed">
            The institute functions as a sponsor-led apprenticeship intermediary model in which program standards, curriculum oversight, compliance tracking, and apprentice registration are managed centrally by the sponsor. Apprentices are enrolled in structured programs that combine related technical instruction (RTI) with supervised on-the-job training (OJT) at approved employer partner locations.
          </p>
        </section>

        {/* Instruction and Training Delivery Structure */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Instruction and Training Delivery Structure</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            <strong>Related Technical Instruction (RTI)</strong> is provided directly by Elevate for Humanity Career &amp; Technical Institute through structured curriculum, competency-based coursework, and learning management systems aligned with occupational standards.
          </p>
          <p className="text-slate-700 leading-relaxed">
            <strong>On-the-Job Training (OJT)</strong> is delivered at licensed employer and partner training sites that meet applicable state licensing and supervision requirements. All training locations operate under sponsor-approved training plans and documented supervision protocols.
          </p>
        </section>

        {/* Partner Training Site Governance */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Partner Training Site Governance</h2>
          <p className="text-slate-700 leading-relaxed">
            Partner barbershops, employers, and training facilities serve as approved training locations and are not the apprenticeship sponsor or instructional institution. Each partner location participates through a formal training agreement that defines supervision, training scope, hour verification, and compliance expectations in alignment with apprenticeship standards and applicable regulatory requirements.
          </p>
        </section>

        {/* Oversight and Compliance */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Oversight and Compliance</h2>
          <p className="text-slate-700 leading-relaxed">
            Program oversight, standards administration, apprentice registration, hour tracking, competency verification, and regulatory reporting are managed by the sponsor entity, 2Exclusive LLC-S. The institute maintains centralized documentation systems, training records, and compliance monitoring to ensure adherence to apprenticeship standards, workforce funding requirements, and applicable state and federal guidelines.
          </p>
        </section>

        {/* Workforce Funding and Career Pathway Coordination */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Workforce Funding and Career Pathway Coordination</h2>
          <p className="text-slate-700 leading-relaxed">
            Elevate for Humanity Career &amp; Technical Institute coordinates workforce-funded training pathways, including eligibility-based funding programs, career services, and structured training enrollment. Funding eligibility, tuition coverage, and program access may vary based on workforce program approval, participant eligibility, and partner agency requirements.
          </p>
        </section>

        {/* Licensed Facility and Supervision Clarification */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Licensed Facility and Supervision Clarification (Barber and Skilled Trades Programs)</h2>
          <p className="text-slate-700 leading-relaxed">
            For apprenticeship programs requiring licensed facilities or professional supervision, practical training is conducted at approved licensed partner locations under qualified supervision. The institute provides instructional oversight and structured curriculum while partner sites provide hands-on skill development in accordance with state licensing board expectations and apprenticeship standards.
          </p>
        </section>

        {/* Institutional Positioning */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Institutional Positioning</h2>
          <p className="text-slate-700 leading-relaxed">
            Elevate for Humanity Career &amp; Technical Institute operates as a centralized workforce development, career and technical training, and Registered Apprenticeship sponsor organization under the legal governance of 2Exclusive LLC-S. This unified structure allows the institute to deliver instruction, coordinate employer training sites, and administer apprenticeship programs within a single compliant and documented governance framework.
          </p>
        </section>

        {/* Links */}
        <section className="flex flex-wrap gap-4 pt-4 border-t border-slate-200">
          <Link href="/approvals" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
            Approvals &amp; Verification
          </Link>
          <Link href="/apprenticeship-sponsor" className="bg-white hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors">
            Apprenticeship Sponsor
          </Link>
          <Link href="/programs" className="bg-white hover:bg-slate-200 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors">
            Browse Programs
          </Link>
        </section>
      </div>
    </div>
  );
}
