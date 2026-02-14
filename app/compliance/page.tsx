import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = { 
  title: 'Compliance & Credentials | Elevate for Humanity',
  description: 'Compliance posture, credential disclosure, and program-to-credential mapping for Elevate for Humanity workforce programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance',
  },
};

export default function CompliancePage() {
  const programCredentials = [
    { program: 'Barber Apprenticeship', credential: 'Indiana Barber License', issuer: 'Indiana Professional Licensing Agency (IPLA)', delivery: 'State board exam after apprenticeship hours' },
    { program: 'Cosmetology Apprenticeship', credential: 'Indiana Cosmetology License', issuer: 'Indiana Professional Licensing Agency (IPLA)', delivery: 'State board exam after apprenticeship hours' },
    { program: 'CNA Certification', credential: 'Certified Nursing Assistant', issuer: 'Indiana State Department of Health', delivery: 'State competency exam via approved testing site' },
    { program: 'CPR / First Aid (HSI)', credential: 'CPR/AED/First Aid Certification', issuer: 'Health & Safety Institute (HSI)', delivery: 'HSI-authorized instructor assessment' },
    { program: 'HVAC Technician', credential: 'EPA Section 608 Certification', issuer: 'U.S. Environmental Protection Agency', delivery: 'EPA-approved testing organization' },
    { program: 'CDL Training', credential: 'Commercial Driver License', issuer: 'Indiana Bureau of Motor Vehicles', delivery: 'BMV skills and knowledge test' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Compliance & Credentials' }]} />
        </div>
      </div>

      <section className="bg-blue-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Compliance & Credentials</h1>
          <p className="text-xl text-blue-200">
            Transparency about what we deliver, how credentials are earned, and who issues them.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Credential Disclosure</h2>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-gray-700">
            <p>
              Elevate for Humanity delivers training and prepares students for industry-recognized credentials.
              <strong> Credentials and licenses are issued by external credential bodies, exam providers, and state agencies — not by Elevate for Humanity.</strong>
            </p>
            <p>
              Where applicable, certification exams are administered through authorized testing centers or approved proctoring organizations.
              Elevate provides the instruction, materials, and exam preparation; the credentialing authority makes the final determination.
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
