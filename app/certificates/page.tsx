import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  CheckCircle,
  Shield,
  Search,
  Building2,
  FileCheck,
  GraduationCap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Certificates & Credentials | Elevate for Humanity',
  description:
    'Earn industry-recognized certificates and credentials. Verify certificates through government partners including SSA, IRS, DOL, and state licensing boards.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/certificates',
  },
};

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Certificates" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/certificates-hero.jpg"
          alt="Certificates & Credentials"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Award className="h-20 w-20 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
              Certificates & Credentials
            </h1>
            <p className="text-xl md:text-2xl text-white max-w-3xl mx-auto">
              Earn industry-recognized certificates that employers trust and
              value.
            </p>
          </div>
        </div>
      </section>

      {/* Verify Certificate */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <Shield className="h-16 w-16 text-brand-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-black text-black mb-4">
              Verify a Certificate
            </h2>
            <p className="text-lg text-black mb-8">
              Enter a certificate ID to verify its authenticity through our
              government-verified system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g., EFH-2024-12345)"
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl text-black focus:border-brand-blue-600 focus:outline-none"
              />
              <button className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2" aria-label="Action button">
                <Search className="h-5 w-5" />
                Verify
              </button>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-black mb-4">
                <strong>Official Verification Portals:</strong>
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <a
                  href="https://www.ssa.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  SSA.gov
                </a>
                <span className="text-black">•</span>
                <a
                  href="https://www.irs.gov/tax-professionals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  IRS.gov
                </a>
                <span className="text-black">•</span>
                <a
                  href="https://www.dol.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  DOL.gov
                </a>
                <span className="text-black">•</span>
                <a
                  href="https://www.in.gov/pla"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                >
                  Indiana PLA
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certificate Types */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-6">
              Certificates We Offer
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              All certificates are industry-recognized and accepted by employers
              nationwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Healthcare Certifications',
                items: [
                  'Certified Nursing Assistant (CNA)',
                  'Certified Medical Assistant',
                  'Certified Phlebotomy Technician',
                  'Home Health Aide',
                ],
              },
              {
                title: 'Skilled Trades Certifications',
                items: [
                  'EPA 608 Certification',
                  'AWS Welding Certification',
                  'OSHA 10-Hour Safety',
                  'Forklift Operator',
                ],
              },
              {
                title: 'Transportation Certifications',
                items: [
                  'CDL Class A',
                  'CDL Class B',
                  'Passenger Endorsement',
                  'Hazmat Endorsement',
                ],
              },
              {
                title: 'Technology Certifications',
                items: [
                  'CompTIA A+',
                  'CompTIA Network+',
                  'CompTIA Security+',
                  'Microsoft Office Specialist',
                ],
              },
              {
                title: 'Business Certifications',
                items: [
                  'QuickBooks Certified User',
                  'Customer Service Professional',
                  'Office Administration',
                  'Bookkeeping',
                ],
              },
              {
                title: 'Food Service Certifications',
                items: [
                  'ServSafe Food Handler',
                  'ServSafe Manager',
                  'Alcohol Server Training',
                  'Food Safety Manager',
                ],
              },
            ].map((category) => (
              <div
                key={category.title}
                className="bg-white border-2 border-gray-200 rounded-2xl p-8"
              >
                <h3 className="text-2xl font-black text-black mb-6">
                  {category.title}
                </h3>
                <ul className="space-y-3">
                  {category.items.map((item: any) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="h-10 w-10 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-black">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Government Partners */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-6">
              Government Credential Partners
            </h2>
            <p className="text-xl text-black max-w-3xl mx-auto">
              Our credentials are verified through official government agencies
              and recognized nationwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <Building2 className="h-12 w-12 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">SSA</h3>
              <p className="text-sm text-black mb-3">
                Social Security Administration
              </p>
              <a
                href="https://www.ssa.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                ssa.gov →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <FileCheck className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">IRS</h3>
              <p className="text-sm text-black mb-3">
                Internal Revenue Service - Tax Preparer Credentials
              </p>
              <a
                href="https://www.irs.gov/tax-professionals/enrolled-agents"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                irs.gov →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <GraduationCap className="h-12 w-12 text-brand-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">DOL</h3>
              <p className="text-sm text-black mb-3">
                Department of Labor - Apprenticeship Programs
              </p>
              <a
                href="https://www.dol.gov/apprenticeship"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                dol.gov →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <Shield className="h-12 w-12 text-orange-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">DOT</h3>
              <p className="text-sm text-black mb-3">
                Department of Transportation - CDL Verification
              </p>
              <a
                href="https://www.fmcsa.dot.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                fmcsa.dot.gov →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <Award className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">HHS</h3>
              <p className="text-sm text-black mb-3">
                Health & Human Services - Healthcare Credentials
              </p>
              <a
                href="https://www.hhs.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                hhs.gov →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <CheckCircle className="h-12 w-12 text-teal-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">WIOA</h3>
              <p className="text-sm text-black mb-3">
                Workforce Innovation & Opportunity Act
              </p>
              <a
                href="https://www.dol.gov/agencies/eta/wioa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                WIOA Programs →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <Building2 className="h-12 w-12 text-indigo-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">NCCA</h3>
              <p className="text-sm text-black mb-3">
                National Commission for Certifying Agencies
              </p>
              <a
                href="https://www.credentialingexcellence.org/ncca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                Accreditation →
              </a>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <FileCheck className="h-12 w-12 text-pink-600 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">
                State Boards
              </h3>
              <p className="text-sm text-black mb-3">
                Professional Licensing & Verification
              </p>
              <a
                href="https://www.in.gov/pla"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-semibold"
              >
                Indiana PLA →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-black mb-6">
              Why Our Certificates Matter
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-11 w-11 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Industry Recognized
              </h3>
              <p className="text-black">
                Accepted by employers nationwide and meet industry standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-11 w-11 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Verified & Secure
              </h3>
              <p className="text-black">
                Digital verification system prevents fraud and ensures
                authenticity.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-11 w-11 text-brand-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Career Advancement
              </h3>
              <p className="text-black">
                Boost your resume and qualify for higher-paying positions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-black mb-6">
            Ready to Earn Your Certificate?
          </h2>
          <p className="text-xl text-black mb-8">
            Apply today and start your journey to a certified career.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Apply Now - It's Free
          </Link>
        </div>
      </section>
    </div>
  );
}
