import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Users, Building2, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bulk Testing for Employers | Elevate Testing Center',
  description: 'Bulk testing arrangements for employers. Schedule multiple employees for certification exams.',
};

export default function ForEmployersPage() {
  const benefits = [
    'Volume pricing available',
    'Flexible scheduling for groups',
    'Dedicated testing sessions',
    'Detailed completion reports',
    'Custom certification pathways',
  ];

  return (
    <main className="min-h-screen">
      <section className="bg-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'For Employers' }]} />
          <div className="mt-8">
            <h1 className="text-4xl md:text-5xl font-black mb-4">Bulk Testing for Employers</h1>
            <p className="text-xl text-blue-200 max-w-2xl">
              Schedule multiple employees for certification exams with flexible group booking options.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Why Test With Elevate?</h2>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-slate-600 mb-6">
                Contact us to arrange bulk testing for your organization.
              </p>
              <Link href="/testing/book" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-red-700 transition">
                <CalendarDays className="w-5 h-5" /> Schedule Group Testing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
