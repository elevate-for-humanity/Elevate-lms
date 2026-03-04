export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const metadata: Metadata = { 
  title: 'Compliance & Credentials | Elevate for Humanity',
  description: 'Compliance posture, credential disclosure, and program-to-credential mapping for Elevate for Humanity workforce programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance',
  },
};

export default async function CompliancePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('compliance_audits').select('*').limit(50);

  const programCredentials = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Compliance & Credentials' }]} />
        </div>
      </div>

      <section className="bg-brand-blue-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Compliance & Credentials</h1>
          <p className="text-xl text-brand-blue-200">
            Transparency about what we deliver, how credentials are earned, and who issues them.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Credential Disclosure</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
            <p>
              Training is delivered through licensed credential partners and approved program holders under centralized institutional oversight by Elevate for Humanity, preparing students for industry-recognized credentials.
              <strong> Credentials and licenses are issued by external credential bodies, exam providers, and state agencies — not by Elevate for Humanity.</strong>
            </p>
            <p>
              Where applicable, certification exams are administered through authorized testing centers or approved proctoring organizations.
              Elevate coordinates instruction through licensed credential partners, provides materials and exam preparation support; the credentialing authority makes the final determination.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Program-to-Credential Mapping</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Program</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Credential</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Issued By</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">How Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {programCredentials.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.program}</td>
                    <td className="px-4 py-3 text-gray-700">{row.credential}</td>
                    <td className="px-4 py-3 text-gray-600">{row.issuer}</td>
                    <td className="px-4 py-3 text-gray-600">{row.delivery}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Registrations & Approvals</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3 text-gray-700">
            <div className="flex justify-between border-b pb-3">
              <span className="font-medium">DOL RAPIDS Registered Apprenticeship Sponsor</span>
              <span className="text-gray-500">Program #2025-IN-132301</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="font-medium">Indiana DWD Listed Training Provider</span>
              <span className="text-gray-500">INTraining ID: 10004621</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">WIOA / WRG / JRI Eligible Programs</span>
              <span className="text-gray-500">Via EmployIndy and regional workforce boards</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Institutional Compliance Documents</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <Link href="/compliance/apprenticeship-structure" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Apprenticeship & RTI Structure</h3>
              <p className="text-sm text-gray-500 mt-1">Master compliance document: institutional hierarchy, RTI/OJT hour mapping, credential issuance chain</p>
            </Link>
            <Link href="/compliance/credential-partners" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Credential Partner Registry</h3>
              <p className="text-sm text-gray-500 mt-1">Per-program credential partners, license status, MOU requirements</p>
            </Link>
            <Link href="/compliance/workforce-partnership-packet" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Workforce Partnership Packet</h3>
              <p className="text-sm text-gray-500 mt-1">Ready-to-share packet for workforce boards and community partners</p>
            </Link>
            <Link href="/instructional-framework" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Instructional Framework</h3>
              <p className="text-sm text-gray-500 mt-1">RTI governance, provider tiers, competency tracking, assessment authority</p>
            </Link>
            <Link href="/instructor-credentials" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Instructor Credentials</h3>
              <p className="text-sm text-gray-500 mt-1">Per-program instructor qualifications, credential partner requirements, MOU framework</p>
            </Link>
            <Link href="/compliance/competency-verification" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Competency Verification Matrix</h3>
              <p className="text-sm text-gray-500 mt-1">Per-program assessment rubrics with competency-to-assessment mapping and pass criteria</p>
            </Link>
            <Link href="/compliance/competency-verification/barber" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Barber Apprenticeship Rubric</h3>
              <p className="text-sm text-gray-500 mt-1">6-section, 30-competency RAPIDS-aligned rubric for barbershop apprenticeship</p>
            </Link>
            <Link href="/workone-partner-packet" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">WorkOne Partner Packet</h3>
              <p className="text-sm text-gray-500 mt-1">ETPL-ready partnership documentation for WorkOne regions</p>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security & Privacy</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
            <p>
              Elevate for Humanity collects personal information — including government-issued IDs,
              Social Security Numbers, and eligibility documents — as required for workforce funding
              verification under WIOA, WRG, and JRI guidelines. We treat this data with the highest
              level of care.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Encryption</h3>
                <p className="text-sm">All data is encrypted in transit (TLS 1.2+) and at rest. SSNs are
                  hashed immediately upon submission — plain-text SSNs are never stored or displayed.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Access Controls</h3>
                <p className="text-sm">Documents are stored in private storage buckets with row-level security.
                  Access is restricted to authorized compliance staff through role-based permissions.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Audit Trail</h3>
                <p className="text-sm">All document access and administrative actions are logged in an immutable
                  audit trail. Access events include timestamp, user identity, and action performed.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Short-Lived Access</h3>
                <p className="text-sm">When staff review documents, temporary access URLs are generated on demand
                  and expire within 60 seconds. No permanent document links are stored in the system.</p>
              </div>
            </div>
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-brand-blue-900">
                <strong>Workforce Compliance Alignment:</strong> Our data handling practices align with
                WIOA participant data requirements, FERPA student record protections, and Indiana DWD
                data security standards. For questions about our security practices, contact us at{' '}
                <Link href="/contact" className="underline">elevateforhumanity.org/contact</Link>.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Workforce Board Alignment</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
            <p>
              Elevate for Humanity coordinates with the local workforce development board through <strong>WorkOne Indianapolis (Region 5)</strong> for all WIOA-funded participant services. This includes referrals, OJT contracts, work experience authorizations, credential attainment reporting, and employment outcome tracking.
            </p>
            <p>
              OJT reimbursement rates, work experience stipends, and internship wage structures are governed by local board policy — not set by Elevate. All placements require approval from the assigned WorkOne career advisor or case manager before training begins.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mt-4">
              <Link href="/compliance/internship-agreement" className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition block">
                <h3 className="font-semibold text-gray-900 text-sm">Internship Agreement</h3>
                <p className="text-xs text-gray-500 mt-1">Structured work-based learning placement template</p>
              </Link>
              <Link href="/compliance/ojt-training-plan" className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition block">
                <h3 className="font-semibold text-gray-900 text-sm">OJT Training Plan</h3>
                <p className="text-xs text-gray-500 mt-1">Skills schedule, evaluation timeline, compliance notes</p>
              </Link>
              <Link href="/compliance/internship-evaluation" className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition block">
                <h3 className="font-semibold text-gray-900 text-sm">Evaluation Form</h3>
                <p className="text-xs text-gray-500 mt-1">Supervisor competency assessment (midpoint + final)</p>
              </Link>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Policies</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/privacy-policy" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
              <p className="text-sm text-gray-500 mt-1">How we collect, use, and protect your data</p>
            </Link>
            <Link href="/terms-of-service" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Terms of Service</h3>
              <p className="text-sm text-gray-500 mt-1">Terms governing platform use</p>
            </Link>
            <Link href="/ferpa" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">FERPA Compliance</h3>
              <p className="text-sm text-gray-500 mt-1">Student record privacy protections</p>
            </Link>
            <Link href="/contact" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Contact Compliance</h3>
              <p className="text-sm text-gray-500 mt-1">Questions about our compliance posture</p>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
