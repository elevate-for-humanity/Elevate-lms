import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Institutional Governance & Compliance | Elevate for Humanity',
  description: 'Governance framework, legal structure, and compliance posture of 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/institutional-governance' },
};

export default function InstitutionalGovernancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Institutional Governance' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
          Institutional Governance &amp; Compliance
        </h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-700 leading-relaxed mb-8">
            Elevate for Humanity Career &amp; Training Institute operates under the legal governance of 2Exclusive LLC-S and functions as a centralized workforce training provider, Registered Apprenticeship sponsor, and career and technical instructional institution. The organization administers structured training programs, apprenticeship sponsorship, related technical instruction (RTI), and employer-aligned work-based learning through a unified and documented governance framework.
          </p>

          {/* Governance Structure Diagram */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Organizational Structure</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
              <div className="flex flex-col items-center gap-0">
                {/* Level 1 */}
                <div className="w-full max-w-md bg-slate-900 text-white rounded-lg px-6 py-4 text-center">
                  <p className="font-bold text-sm">2Exclusive LLC-S</p>
                  <p className="text-slate-400 text-xs mt-1">Legal Entity &amp; Registered Apprenticeship Sponsor</p>
                  <p className="text-slate-500 text-[10px] mt-1">EIN 88-2609728 | RAPIDS 2025-IN-132301</p>
                </div>
                <div className="w-px h-6 bg-slate-400" />
                <div className="text-slate-400 text-xs">↓</div>
                <div className="w-px h-6 bg-slate-400" />

                {/* Level 2 */}
                <div className="w-full max-w-md bg-brand-blue-600 text-white rounded-lg px-6 py-4 text-center">
                  <p className="font-bold text-sm">Elevate for Humanity Career &amp; Training Institute</p>
                  <p className="text-brand-blue-200 text-xs mt-1">Instruction, Programs &amp; Related Technical Instruction (RTI)</p>
                </div>
                <div className="w-px h-6 bg-slate-400" />
                <div className="text-slate-400 text-xs">↓</div>
                <div className="w-px h-6 bg-slate-400" />

                {/* Level 3 */}
                <div className="w-full max-w-md bg-white border-2 border-slate-300 rounded-lg px-6 py-4 text-center">
                  <p className="font-bold text-sm text-slate-900">Licensed Partner Shops &amp; Employers</p>
                  <p className="text-slate-500 text-xs mt-1">Approved Training Sites &amp; Participating Employers</p>
                </div>
                <div className="w-px h-6 bg-slate-400" />
                <div className="text-slate-400 text-xs">↓</div>
                <div className="w-px h-6 bg-slate-400" />

                {/* Level 4 */}
                <div className="w-full max-w-md bg-brand-green-50 border-2 border-brand-green-300 rounded-lg px-6 py-4 text-center">
                  <p className="font-bold text-sm text-brand-green-900">Apprentices &amp; Students</p>
                  <p className="text-brand-green-700 text-xs mt-1">Related Technical Instruction (RTI) + On-the-Job Training (OJT)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Legal Entity */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Legal Entity</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">Legal Name</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">2Exclusive LLC-S</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">Doing Business As</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">Elevate for Humanity Career &amp; Training Institute</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">EIN</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">88-2609728</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">RAPIDS Program Number</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">2025-IN-132301</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">Sponsor Type</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">Single Employer</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">Registration Status</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">Registered (OA)</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">Agency</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">U.S. Department of Labor — Office of Apprenticeship</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs uppercase tracking-wider">Location</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5">8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240 (Marion County)</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Governance Framework */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Governance Framework</h2>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h3 className="font-bold text-slate-900 mb-2">Program Sponsorship</h3>
                <p>2Exclusive LLC-S serves as the sponsor of record for all Registered Apprenticeship programs. The sponsor oversees apprenticeship standards, curriculum alignment, apprentice registration, hour tracking, and compliance reporting in accordance with U.S. DOL Office of Apprenticeship requirements.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h3 className="font-bold text-slate-900 mb-2">Instructional Delivery</h3>
                <p>Elevate for Humanity Career &amp; Training Institute delivers related technical instruction (RTI) through its learning management system (LMS) and in-person classroom sessions. All instructional content is aligned with occupation-specific competency standards and documented per program requirements.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h3 className="font-bold text-slate-900 mb-2">Training Sites</h3>
                <p>On-the-job training (OJT) is completed at sponsor-approved licensed employer and partner locations operating under formal training agreements. Each participating employer is documented in RAPIDS with an Employer Acceptance Agreement.</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h3 className="font-bold text-slate-900 mb-2">Compliance &amp; Reporting</h3>
                <p>The organization maintains documented compliance with WIOA performance standards, DOL apprenticeship regulations (29 CFR Part 29/30), Indiana Professional Licensing Agency requirements, and applicable state workforce board guidelines. Progress reporting, credential attainment, and employment outcomes are tracked and available to authorized reviewing agencies.</p>
              </div>
            </div>
          </section>

          {/* Sponsor Disclosure */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Apprenticeship Sponsor Disclosure</h2>
            <div className="bg-slate-900 text-white rounded-lg p-6">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wider">Sponsor of Record</dt>
                  <dd className="font-semibold mt-0.5">2Exclusive LLC-S</dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wider">Instructional Provider</dt>
                  <dd className="font-semibold mt-0.5">Elevate for Humanity Career &amp; Training Institute</dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-xs uppercase tracking-wider">Training Sites</dt>
                  <dd className="font-semibold mt-0.5">Sponsor-approved licensed employer and partner locations operating under formal training agreements.</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* RTI Provider Information */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Related Technical Instruction (RTI) Providers</h2>
            <p className="text-sm text-slate-600 mb-4">The following RTI providers are registered in RAPIDS under Program 2025-IN-132301.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Occupation</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">RTI Provider</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Hours</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { occ: 'Building Services Technician', provider: '2Exclusive LLC-S', hours: '432', method: 'Classroom / Shop / Web-Based' },
                    { occ: 'Hair Stylist', provider: '2Exclusive LLC-S', hours: '154', method: 'Classroom / Shop / Web-Based' },
                    { occ: 'Barber', provider: 'Elevate for Humanity Career & Training Institute', hours: '260', method: 'Classroom / Web-Based' },
                    { occ: 'Esthetician', provider: 'Elevate for Humanity Career & Training Institute', hours: '300', method: 'Classroom / Web-Based' },
                    { occ: 'Nail Tech', provider: 'Elevate for Humanity Career & Training Institute', hours: '200', method: 'Classroom / Web-Based' },
                    { occ: 'Youth Culinary', provider: 'Elevate for Humanity Career & Training Institute', hours: '144', method: 'Classroom / Web-Based' },
                  ].map((r) => (
                    <tr key={r.occ}>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{r.occ}</td>
                      <td className="px-4 py-2.5 text-slate-700">{r.provider}</td>
                      <td className="px-4 py-2.5 text-slate-700">{r.hours}</td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{r.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Funding Disclosure */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Funding &amp; Eligibility Disclosure</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Training may be fully funded for eligible participants through workforce programs such as WIOA, JRI, and approved funding partners. Eligibility and funding determinations are subject to program and agency guidelines. Elevate for Humanity Career &amp; Training Institute does not guarantee funding approval. Self-pay enrollment options are available for participants who do not qualify for funded programs.
            </p>
          </section>

          {/* Navigation */}
          <div className="border-t border-slate-200 pt-8 flex flex-wrap gap-3">
            <Link href="/verification-approvals" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors">
              Verification &amp; Approvals
            </Link>
            <Link href="/compliance" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors">
              Compliance &amp; Security
            </Link>
            <Link href="/programs" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:border-brand-blue-400 hover:text-brand-blue-600 transition-colors">
              Training Programs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
