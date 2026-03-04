import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Scale, Phone, Mail, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/grievance' },
  title: 'Grievance Procedure | Elevate For Humanity',
  description: 'File a grievance if you believe you were denied services, experienced discrimination, or were treated unfairly in our WIOA-funded programs.',
};

const STEPS = [
  { step: '1', title: 'Informal Resolution', desc: 'Speak directly with your instructor or enrollment advisor. Many concerns can be resolved through a conversation within 5 business days.' },
  { step: '2', title: 'Written Grievance', desc: 'If unresolved, submit a written grievance to the Program Director within 10 business days of the incident. Include your name, date, description of the issue, and desired resolution.' },
  { step: '3', title: 'Formal Review', desc: 'The Program Director will review your grievance and provide a written response within 15 business days. You may be asked to participate in a meeting.' },
  { step: '4', title: 'Appeal', desc: 'If you are not satisfied with the response, you may appeal to the Executive Director within 10 business days of receiving the decision.' },
];

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Grievance Procedure' }]} />
      </div>

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/grievance-page-1.jpg" alt="Grievance process" fill sizes="100vw" className="object-cover" priority />
      </section>

      {/* Header */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Scale className="w-10 h-10 mx-auto mb-4 text-gray-300" />
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Grievance Procedure</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Elevate for Humanity is committed to fair treatment of all participants. If you believe you have been treated unfairly, denied services, or experienced discrimination, you have the right to file a grievance.
          </p>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-12 border-b">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
            <ul className="space-y-3 text-gray-700">
              <li>You have the right to file a grievance without fear of retaliation.</li>
              <li>You have the right to a timely and fair review of your complaint.</li>
              <li>You have the right to be informed of the outcome in writing.</li>
              <li>You have the right to appeal any decision you disagree with.</li>
              <li>You may file a complaint with the appropriate state or federal agency at any time.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Grievance Process */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Grievance Process</h2>
          <div className="space-y-8">
            {STEPS.map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-10 h-10 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grounds for Grievance */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Grounds for Filing</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Denial of services or program access',
              'Discrimination based on race, color, national origin, sex, age, disability, religion, or political affiliation',
              'Retaliation for filing a previous complaint',
              'Violation of WIOA program requirements',
              'Unfair treatment by staff or instructors',
              'Breach of confidentiality',
            ].map((item) => (
              <div key={item} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Submit */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Submit a Grievance</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <Mail className="w-6 h-6 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">By Email</h3>
              <p className="text-gray-600 text-sm mb-2">Send your written grievance to:</p>
              <a href="mailto:grievance@elevateforhumanity.org" className="text-brand-blue-600 font-medium">grievance@elevateforhumanity.org</a>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <Phone className="w-6 h-6 text-brand-blue-600 mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">By Phone</h3>
              <p className="text-gray-600 text-sm mb-2">Call to discuss your concern or request a grievance form:</p>
              <a href="tel:+13173143757" className="text-brand-blue-600 font-medium">(317) 314-3757</a>
            </div>
          </div>
        </div>
      </section>

      {/* External Agencies */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">External Agencies</h2>
          <p className="text-gray-600 mb-4 text-sm">
            You may also file a complaint directly with the following agencies at any time:
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Indiana Department of Workforce Development (DWD)</strong> — for WIOA program complaints</li>
            <li><strong>U.S. Department of Labor, Civil Rights Center</strong> — for discrimination complaints under WIOA Section 188</li>
            <li><strong>U.S. Equal Employment Opportunity Commission (EEOC)</strong> — for employment discrimination</li>
          </ul>
        </div>
      </section>

      {/* EEO Notice */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 text-sm text-gray-600">
            <p className="font-semibold text-gray-900 mb-2">Equal Opportunity Notice</p>
            <p>
              Elevate for Humanity is an equal opportunity employer/program. Auxiliary aids and services are available upon request to individuals with disabilities. TTY/TDD relay services are available by calling 711.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
