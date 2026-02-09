import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Download } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = { 
  title: 'Compliance Center | Elevate LMS',
  description: 'Access our policies, certifications, and compliance documentation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/compliance',
  },
};

export default function CompliancePage() {
  const documents = [
    { id: '1', title: 'Student Handbook', version: '2025.1', updated: 'Jan 2025', status: 'current' },
    { id: '2', title: 'Privacy Policy', version: '3.2', updated: 'Dec 2024', status: 'current' },
    { id: '3', title: 'Terms of Service', version: '2.8', updated: 'Nov 2024', status: 'current' },
    { id: '4', title: 'Accreditation Certificate', version: '2024', updated: 'Sep 2024', status: 'current' },
    { id: '5', title: 'Safety Guidelines', version: '1.5', updated: 'Oct 2024', status: 'current' },
  ];

  const certifications = [
    { name: 'ACCSC Accredited', description: 'Accrediting Commission of Career Schools and Colleges', valid: 'Through 2027' },
    { name: 'State Licensed', description: 'Licensed in all operating states', valid: 'Annual renewal' },
    { name: 'VA Approved', description: 'Approved for GI Bill benefits', valid: 'Active' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 prose-institutional">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Compliance' }]} />
        </div>
      </div>

      {/* Hero with image */}
      <section className="relative h-64 overflow-hidden">
        <Image
          src="/images/business/customer-service.jpg"
          alt="Compliance Center"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-blue-900/70" />
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <h1 className="text-4xl font-bold text-white mb-4">Compliance Center</h1>
            <p className="text-xl text-blue-200 max-w-2xl">
              Access our policies, certifications, and compliance documentation.
            </p>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Policy Documents</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Document</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Version</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Updated</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{doc.title}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{doc.version}</td>
                      <td className="px-6 py-4 text-gray-600">{doc.updated}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-blue-600 hover:text-blue-700">
                          <Download className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Certifications</h2>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="relative h-24">
                    <Image src="/images/trades/program-building-construction.jpg" alt={cert.name} fill sizes="100vw" className="object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                    <p className="text-xs text-green-600 font-medium mt-2">{cert.valid}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Questions?</h3>
              <p className="text-sm text-blue-700 mb-4">Contact our compliance team for any questions about our policies.</p>
              <Link href="/contact" className="text-blue-600 hover:underline text-sm font-medium">
                Contact Compliance Team
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
