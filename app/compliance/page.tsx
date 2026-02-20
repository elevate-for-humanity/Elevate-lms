export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = { 
  title: 'Compliance & Credentials | Elevate for Humanity',
  description: 'Compliance posture, credential disclosure, and program-to-credential mapping for Elevate for Humanity workforce programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance',
  },
};

export default async function CompliancePage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('compliance_records').select('*').limit(50);

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
              <span className="font-medium">Indiana DWD Approved Training Provider</span>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Policies</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/privacy" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
              <h3 className="font-semibold text-gray-900">Privacy Policy</h3>
              <p className="text-sm text-gray-500 mt-1">How we collect, use, and protect your data</p>
            </Link>
            <Link href="/terms" className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition block">
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
