import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, Download, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certificates | Elevate for Humanity',
  description: 'Earn industry-recognized credentials through Elevate for Humanity\'s certification programs.',
};

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Certificates & Credentials</h1>
          <p className="text-xl text-blue-100">
            Industry-recognized credentials to advance your career.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-brand-blue-50 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify a Certificate</h2>
            <p className="text-gray-600 mb-6">
              Employers and licensing boards can verify any certificate issued by Elevate for Humanity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/verify-credentials" className="inline-flex items-center justify-center px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
                <Search className="w-5 h-5 mr-2" />
                Verify Certificate
              </Link>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Certifications</h2>
          <div className="space-y-4">
            {[
              { name: 'CNA - Certified Nursing Assistant', org: 'Indiana State Department of Health' },
              { name: 'QMA - Qualified Medication Aide', org: 'Indiana State Board of Nursing' },
              { name: 'Phlebotomy Technician (NHA)', org: 'National Healthcareer Association' },
              { name: 'Medical Assistant (NHA)', org: 'National Healthcareer Association' },
              { name: 'EPA 608 Universal Certification', org: 'Environmental Protection Agency' },
              { name: 'ACT WorkKeys/NCRC', org: 'ACT, Inc.' },
              { name: 'MOS/Microsoft Office Specialist', org: 'Certiport' },
              { name: 'IC3 Digital Literacy', org: 'Certiport' },
            ].map((cert) => (
              <div key={cert.name} className="bg-slate-50 rounded-xl p-6 flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{cert.name}</h3>
                  <p className="text-gray-600 text-sm">{cert.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Earn Your Certificate</h2>
          <p className="text-gray-600 mb-8">
            Our programs prepare you for industry-recognized certifications that employers value.
          </p>
          <Link href="/programs" className="px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700">
            View Programs
          </Link>
        </div>
      </section>
    </div>
  );
}
