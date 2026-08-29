export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, Users, Scale, Accessibility, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Equal Opportunity,
  description: 'Elevate for Humanity is committed to equal opportunity and non-discrimination in all programs and services.',
};

const policies = [
  {
    title: 'Federal Compliance Policy',
    href: '/legal/disclosures',
    description: 'Our compliance with FERPA, Title IX, ADA, WIOA, and other federal regulations.',
    icon: Shield,
    color: 'blue',
  },
  {
    title: 'FERPA Policy',
    href: '/legal/disclosures',
    description:
      'Family Educational Rights and Privacy Act - protecting student education records.',
    icon: FileText,
    color: 'green',
  },
  {
    title: 'WIOA Policy',
    href: '/legal/disclosures',
    description:
      'Workforce Innovation and Opportunity Act compliance and equal access requirements.',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Grievance Procedure',
    href: '/legal/disclosures',
    description:
      'How to file a complaint or grievance regarding discrimination or policy violations.',
    icon: Scale,
    color: 'orange',
  },
  {
    title: 'Admissions Policy',
    href: '/legal/disclosures',
    description: 'Non-discriminatory admissions practices and eligibility requirements.',
    icon: Users,
    color: 'teal',
  },
  {
    title: 'Privacy Policy',
    href: '/legal/privacy',
    description: 'How we collect, use, and protect your personal information.',
    icon: Shield,
    color: 'indigo',
  },
  {
    title: 'Accessibility',
    href: '/accessibility',
    description:
      'Our commitment to accessibility and accommodations for individuals with disabilities.',
    icon: Accessibility,
    color: 'rose',
  },
  {
    title: 'Terms of Service',
    href: '/legal',
    description: 'Terms and conditions for using our services and programs.',
    icon: FileText,
    color: 'amber',
  },
];

const colorClasses: Record<string, { bg: string; border: string; icon: string }> = {
  blue: { bg: 'bg-brand-blue-50', border: 'border-brand-blue-200', icon: 'text-brand-blue-600' },
  green: {
    bg: 'bg-brand-green-50',
    border: 'border-brand-green-200',
    icon: 'text-brand-green-600',
  },
  orange: {
    bg: 'bg-brand-orange-50',
    border: 'border-brand-orange-200',
    icon: 'text-brand-orange-600',
  },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'text-rose-600' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
};

export default function EqualOpportunityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <span className="bg-white/20 text-white px-4 py-1 rounded-full text-sm font-medium">Our Commitment</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Equal Opportunity</h1>
          <p className="text-xl text-blue-100 max-w-2xl">Elevate for Humanity is committed to providing equal access to workforce development programs and services regardless of race, color, religion, sex, national origin, disability, or other protected characteristics.</p>
        </div>
      </section>
      
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Equal Opportunity Statement</h2>
            <p className="text-slate-600 mb-6">
              Elevate for Humanity, Inc. does not discriminate on the basis of race, color, national origin, 
              sex, disability, or age in its programs, activities, or employment. We are committed to 
              ensuring access to quality workforce development opportunities for all individuals.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Title VI Compliance</h4>
                  <p className="text-slate-600 text-sm">No discrimination based on race, color, or national origin</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Title IX Compliance</h4>
                  <p className="text-slate-600 text-sm">No discrimination based on sex or gender</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">ADA Compliance</h4>
                  <p className="text-slate-600 text-sm">Accessibility accommodations for individuals with disabilities</p>
                </div>
              </div>
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Age Discrimination Act</h4>
                  <p className="text-slate-600 text-sm">No discrimination based on age in programs receiving federal funds</p>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Policies & Procedures</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {policies.map((policy) => {
              const Icon = policy.icon;
              const colors = colorClasses[policy.color];
              return (
                <Link
                  key={policy.title}
                  href={policy.href}
                  className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-md transition-shadow`}
                >
                  <Icon className={`w-8 h-8 ${colors.icon} mb-4`} />
                  <h3 className="font-bold text-slate-900 mb-2">{policy.title}</h3>
                  <p className="text-slate-600 text-sm">{policy.description}</p>
                </Link>
              );
            })}
          </div>
          
          <div className="bg-brand-blue-700 rounded-2xl p-8 md:p-12 text-white mt-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Need Accommodations?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">If you need accommodations to participate in any of our programs or services, please contact us. We are committed to making our programs accessible to everyone.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+13173143757" className="bg-white text-brand-blue-700 font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-colors">
                Call (317) 314-3757
              </a>
              <Link href="/contact" className="bg-white/20 text-white font-bold py-3 px-8 rounded-lg hover:bg-white/30 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
