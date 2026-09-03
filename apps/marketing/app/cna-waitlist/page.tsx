import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'CNA Waitlist | Elevate for Humanity',
  description: 'Join the waitlist for the Certified Nursing Assistant program at Elevate for Humanity. Limited seats available. WIOA and WRG funding accepted.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/cna-waitlist' },
};

export default function CnaWaitlistPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'CNA', href: '/programs/cna' }, { label: 'Waitlist' }]} />
      </div>
      <section className="bg-slate-900 text-white py-16 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <Clock className="w-4 h-4" /> Limited Seats Available
        </div>
        <h1 className="text-4xl font-black mb-4">CNA Program Waitlist</h1>
        <p className="text-slate-300 max-w-xl mx-auto text-lg">
          The Certified Nursing Assistant program fills quickly. Join the waitlist and we will contact you when a seat opens.
        </p>
      </section>
      <section className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-blue-900 mb-2">About the CNA Program</h2>
          <ul className="space-y-2 text-sm text-blue-800">
            {[
              '6-week accelerated program — classroom and clinical hours',
              'Prepares you for the Indiana State CNA competency exam',
              'WIOA and Workforce Ready Grant funding accepted',
              'Job placement support with nursing home and hospital partners',
              'Starting wages: $16–$22/hr in Central Indiana',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Join the Waitlist</h2>
          <p className="text-slate-600 text-sm mb-6">
            Submit a general application and select CNA as your program interest. We will contact you when the next cohort opens.
          </p>
          <Link href="/apply" className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition">
            Apply Now <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-4 text-sm text-slate-500">
            Questions? <Link href="/contact" className="text-brand-blue-600 hover:underline">Contact us</Link> or call <a href="tel:+13173143757" className="text-brand-blue-600 hover:underline">(317) 314-3757</a>.
          </div>
        </div>
      </section>
    </div>
  );
}
