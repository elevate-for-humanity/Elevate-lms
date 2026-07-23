import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'For Students',
  description: 'For Students page content.',
};

const steps = [
  { n: '1', title: 'Apply', desc: 'Submit one application. We handle the rest.' },
  { n: '2', title: 'Get Approved for Funding', desc: 'We check WIOA, WRG, FSSA, and other sources on your behalf.' },
  { n: '3', title: 'Get Placed in a Program', desc: 'Matched to a program based on your goals and eligibility.' },
  { n: '4', title: 'Complete Training', desc: 'Delivered by Elevate or an approved training partner.' },
  { n: '5', title: 'Test & Get Certified', desc: 'Testing coordinated through Elevate or approved certifying bodies.' },
  { n: '6', title: 'Get Placed into Employment', desc: 'Connected to employers and apprenticeship opportunities.' },
];

const categories = [
  { label: 'Healthcare', href: '/programs/healthcare' },
  { label: 'Skilled Trades', href: '/programs/skilled-trades' },
  { label: 'CDL Training', href: '/programs/cdl-training' },
  { label: 'Cosmetology & Barbering', href: '/programs/cosmetology-apprenticeship' },
  { label: 'Apprenticeships', href: '/apprenticeships' },
  { label: 'View All Programs', href: '/programs' },
];

const funding = [
  { label: 'WIOA', desc: 'Workforce Innovation & Opportunity Act — federal funding for eligible participants.' },
  { label: 'Workforce Ready Grant', desc: 'Indiana state-funded training support for high-demand careers.' },
  { label: 'FSSA Programs', desc: ', TANF, and support services for eligible participants.' },
];

export default function ForStudentsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">For Students</h1>
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

