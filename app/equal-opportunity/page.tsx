export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Equal Opportunity | Elevate for Humanity',
  description: 'Equal Opportunity page content.',
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
    description:
      'Family Educational Rights and Privacy Act - protecting student education records.',
    icon: FileText,
    color: 'green',
  },
  {
    title: 'WIOA Policy',
    href: '/policies/wioa',
    description:
      'Workforce Innovation and Opportunity Act compliance and equal access requirements.',
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Grievance Procedure',
    href: '/policies/grievance',
    description:
      'How to file a complaint or grievance regarding discrimination or policy violations.',
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
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Equal Opportunity</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}

