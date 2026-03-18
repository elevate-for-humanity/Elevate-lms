import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield, Scale, Users, FileText, ArrowRight, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Federal Compliance | Elevate For Humanity',
  description: 'Our commitment to federal compliance including WIOA, FERPA, ADA, and equal opportunity standards. View our policies and compliance documentation.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/federal-compliance',
  },
};

export default function FederalCompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Federal Compliance' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-brand-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-10 h-10 text-brand-blue-400" />
              <span className="text-brand-blue-400 font-medium">Regulatory Compliance</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Federal Compliance
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Elevate for Humanity is committed to full compliance with all federal regulations 
              governing workforce development, education, and equal opportunity. We maintain 
              rigorous standards to protect participants and ensure program integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* WIOA Compliance */}
          <div className="mb-16">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  WIOA Compliance
                </h2>
                <p className="text-lg text-black">
                  Workforce Innovation and Opportunity Act
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8">
              <p className="text-black mb-6">
                Our programs are designed to meet WIOA requirements for eligible training providers and workforce development activities.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Eligible Training Provider:</strong> Programs listed on state Eligible Training Provider Lists (ETPL)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Performance Reporting:</strong> Track and report participant outcomes as required
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Equal Opportunity:</strong> Non-discrimination in all programs and activities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Data Privacy:</strong> Protect participant personally identifiable information (PII)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* FERPA Compliance */}
          <div className="mb-16">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  FERPA Compliance
                </h2>
                <p className="text-lg text-black">
                  Family Educational Rights and Privacy Act
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8">
              <p className="text-black mb-6">
                We protect student education records in accordance with FERPA requirements.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Student Consent:</strong> Obtain written consent before disclosing education records
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Access Rights:</strong> Students can review and request amendments to their records
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Secure Storage:</strong> Education records stored securely with access controls
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Limited Disclosure:</strong> Share information only as permitted by law
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ADA Compliance */}
          <div className="mb-16">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-brand-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  ADA Compliance
                </h2>
                <p className="text-lg text-black">
                  Americans with Disabilities Act
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8">
              <p className="text-black mb-6">
                Our platform and programs are accessible to individuals with disabilities.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Web Accessibility:</strong> WCAG 2.1 Level AA compliance for digital content
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Reasonable Accommodations:</strong> Provide accommodations for participants with disabilities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Accessible Facilities:</strong> Physical locations meet ADA accessibility standards
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">
                    <strong>Assistive Technology:</strong> Compatible with screen readers and other assistive devices
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Equal Opportunity */}
          <div className="mb-16">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scale className="w-6 h-6 text-brand-orange-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">
                  Equal Opportunity
                </h2>
                <p className="text-lg text-black">
                  Non-Discrimination Policy
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-8">
              <p className="text-black mb-6">
                Elevate for Humanity is an equal opportunity provider and does not discriminate on the basis of:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Race</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Color</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Religion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Sex</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">National Origin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Age</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Disability</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Veteran Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Genetic Information</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="text-black">Citizenship Status</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-brand-blue-50 border-2 border-brand-blue-600 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-brand-blue-900 mb-4">
              Questions or Concerns?
            </h3>
            <p className="text-brand-blue-800 mb-6">
              If you have questions about our compliance policies or wish to file a complaint, please contact us:
            </p>
            <div className="space-y-2 text-brand-blue-900">
              <p><strong>Email:</strong> our contact form</p>
              <p><strong>Phone:</strong> (317) 314-3757</p>
              <p><strong>Address:</strong> Indianapolis, IN</p>
            </div>
          </div>

          {/* Related Links */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Link
              href="/privacy-policy"
              className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand-blue-600 transition"
            >
              <h4 className="font-bold text-black mb-2">Privacy Policy</h4>
              <p className="text-sm text-black">How we protect your personal information</p>
            </Link>
            <Link
              href="/accessibility"
              className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand-blue-600 transition"
            >
              <h4 className="font-bold text-black mb-2">Accessibility</h4>
              <p className="text-sm text-black">Our commitment to digital accessibility</p>
            </Link>
            <Link
              href="/security"
              className="block p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-brand-blue-600 transition"
            >
              <h4 className="font-bold text-black mb-2">Security</h4>
              <p className="text-sm text-black">How we keep your data secure</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Questions About Compliance?</h2>
          <p className="text-xl text-brand-blue-100 mb-8">
            Contact our compliance team for more information about our policies and procedures.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-white transition"
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/support"
              className="inline-flex items-center gap-2 bg-brand-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-800 transition border border-white/30"
            >
              <Phone className="w-5 h-5" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
