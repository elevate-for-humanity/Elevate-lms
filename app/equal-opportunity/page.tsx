import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Scale, Shield, Users, Heart, Accessibility, FileText, ArrowRight, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Equal Opportunity Employer | Elevate for Humanity',
  description: 'Elevate for Humanity is an equal opportunity employer and training provider. Learn about our non-discrimination policies and commitment to equal access.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/equal-opportunity',
  },
};

const policies = [
  {
    title: 'Federal Compliance Policy',
    href: '/policies/federal-compliance',
    description: 'Our compliance with FERPA, Title IX, ADA, WIOA, and other federal regulations.',
    icon: Shield,
    color: 'blue',
  },
  {
    title: 'FERPA Policy',
    href: '/policies/ferpa',
    description: 'Family Educational Rights and Privacy Act - protecting student education records.',
    icon: FileText,
    color: 'green',
  },
  {
    title: 'WIOA Policy',
    href: '/policies/wioa',
    description: 'Workforce Innovation and Opportunity Act compliance and equal access requirements.',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Grievance Procedure',
    href: '/policies/grievance',
    description: 'How to file a complaint or grievance regarding discrimination or policy violations.',
    icon: Scale,
    color: 'orange',
  },
  {
    title: 'Admissions Policy',
    href: '/policies/admissions',
    description: 'Non-discriminatory admissions practices and eligibility requirements.',
    icon: Users,
    color: 'teal',
  },
  {
    title: 'Privacy Policy',
    href: '/privacy-policy',
    description: 'How we collect, use, and protect your personal information.',
    icon: Shield,
    color: 'indigo',
  },
  {
    title: 'Accessibility',
    href: '/accessibility',
    description: 'Our commitment to accessibility and accommodations for individuals with disabilities.',
    icon: Accessibility,
    color: 'rose',
  },
  {
    title: 'Terms of Service',
    href: '/terms-of-service',
    description: 'Terms and conditions for using our services and programs.',
    icon: FileText,
    color: 'amber',
  },
];

const colorClasses: Record<string, { bg: string; border: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
};

export default function EqualOpportunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-blue-900 border-b border-blue-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Equal Opportunity' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-blue-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="w-8 h-8 text-blue-300" />
            <span className="text-blue-300 font-medium">Compliance</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Equal Opportunity Employer</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Elevate for Humanity is committed to providing equal opportunity in employment and 
            education without regard to race, color, religion, sex, national origin, age, 
            disability, genetic information, or any other protected status.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* EEO Statement */}
        <section className="bg-white rounded-xl shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              Elevate for Humanity is an Equal Opportunity Employer and Training Provider. We are 
              committed to creating and maintaining a workplace and learning environment free from 
              discrimination and harassment.
            </p>
            <p>
              We provide equal employment opportunities to all employees and applicants without 
              regard to race, color, religion, sex (including pregnancy, sexual orientation, and 
              gender identity), national origin, age, disability, genetic information, veteran 
              status, or any other characteristic protected by applicable federal, state, or local law.
            </p>
            <p>
              This policy applies to all terms and conditions of employment, including recruiting, 
              hiring, placement, promotion, termination, layoff, recall, transfer, leaves of absence, 
              compensation, and training.
            </p>
            <p>
              As a recipient of federal funding through WIOA and other workforce development programs, 
              we comply with all applicable non-discrimination requirements and provide equal access 
              to our programs and services.
            </p>
          </div>
        </section>

        {/* Non-Discrimination Policies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Non-Discrimination Policies</h2>
          <p className="text-gray-600 mb-8">
            Click on each policy below to read the full policy document and understand your rights 
            and our obligations under federal law.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {policies.map((policy) => {
              const Icon = policy.icon;
              const colors = colorClasses[policy.color];
              
              return (
                <Link
                  key={policy.href}
                  href={policy.href}
                  className={`${colors.bg} ${colors.border} border-2 rounded-xl p-6 hover:shadow-md transition group`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-2">
                        {policy.title}
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition" />
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {policy.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Protected Classes */}
        <section className="bg-white rounded-xl shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Protected Classes</h2>
          <p className="text-gray-600 mb-6">
            We do not discriminate against any individual based on the following protected characteristics:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              'Race',
              'Color',
              'Religion',
              'Sex',
              'Sexual Orientation',
              'Gender Identity',
              'National Origin',
              'Age',
              'Disability',
              'Genetic Information',
              'Veteran Status',
              'Pregnancy',
              'Citizenship Status',
              'Marital Status',
              'Political Affiliation',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* How to File a Complaint */}
        <section className="bg-blue-50 rounded-xl border-2 border-blue-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How to File a Complaint</h2>
          <p className="text-gray-700 mb-6">
            If you believe you have been discriminated against, you have the right to file a complaint. 
            You may file a complaint with:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Internal Complaint</h3>
              <p className="text-gray-600 text-sm mb-4">
                Contact our Equal Opportunity Officer:
              </p>
              <p className="text-gray-900">
                Email: <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 hover:underline">elevate4humanityedu@gmail.com</a>
              </p>
              <p className="text-gray-900">
                Phone: <a href="/support" className="text-blue-600 hover:underline">Visit Support Center</a>
              </p>
              <p className="mt-4">
                <Link href="/policies/grievance" className="text-blue-600 hover:underline text-sm font-medium">
                  View Grievance Procedure →
                </Link>
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">External Complaint</h3>
              <p className="text-gray-600 text-sm mb-4">
                File with the appropriate federal agency:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• U.S. Equal Employment Opportunity Commission (EEOC)</li>
                <li>• U.S. Department of Labor Civil Rights Center</li>
                <li>• U.S. Department of Education Office for Civil Rights</li>
                <li>• Indiana Civil Rights Commission</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="text-center text-gray-500 text-sm border-t pt-8">
          <p className="font-medium text-gray-700">
            This institution is an equal opportunity provider and employer.
          </p>
          <p className="mt-2">
            Auxiliary aids and services are available upon request to individuals with disabilities.
          </p>
          <p className="mt-2">
            TTY/TDD: 711 (Indiana Relay)
          </p>
        </section>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need Assistance or Have Questions?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Contact us for accommodations, to file a complaint, or for more information about our equal opportunity policies.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              Contact Us <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="/support"
              className="inline-flex items-center gap-2 bg-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-800 transition border border-white/30"
            >
              <Phone className="w-5 h-5" /> Visit Support Center
            </a>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-600 transition"
            >
              Apply for Training <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
