import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CheckCircle, DollarSign, ArrowRight } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tuition & Fees | Elevate for Humanity',
  description:
    'Tuition rates, payment options, and funding eligibility for Elevate for Humanity career training programs. Many programs are fully funded for eligible Indiana residents.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/tuition' },
};

export default function TuitionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Tuition & Fees' }]} />
      </div>

      <section className="bg-slate-900 text-white py-16 px-4 text-center">
        <h1 className="text-4xl font-black mb-4">Tuition & Fees</h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Many programs are fully funded for eligible Indiana residents. Self-pay and financing options are available for non-funded students.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-bold text-green-900 mb-2">Funded Training — $0 Out of Pocket</h2>
          <p className="text-green-800 mb-4">Eligible participants may qualify for full tuition coverage through WIOA, Workforce Ready Grant, JRI, or employer sponsorship. No repayment required.</p>
          <Link href="/check-eligibility" className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition">
            Check My Eligibility <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-6">Self-Pay Tuition Rates</h2>
        <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden mb-10">
          {[
            { program: 'HVAC Technician (EPA 608)', cost: '$2,800', duration: '16 weeks' },
            { program: 'Barber Apprenticeship', cost: '$4,980', duration: '2,000 hours' },
            { program: 'Medical Assistant', cost: '$3,200', duration: '20 weeks' },
            { program: 'Certified Nursing Assistant', cost: '$1,800', duration: '6 weeks' },
            { program: 'IT Help Desk (CompTIA A+)', cost: '$2,400', duration: '14 weeks' },
            { program: 'Cybersecurity Analyst', cost: '$3,600', duration: '20 weeks' },
            { program: 'Welding', cost: '$2,600', duration: '16 weeks' },
            { program: 'Bookkeeping & Accounting', cost: '$2,200', duration: '12 weeks' },
            { program: 'Phlebotomy', cost: '$1,600', duration: '8 weeks' },
            { program: 'Peer Recovery Specialist', cost: '$1,200', duration: '6 weeks' },
          ].map((row) => (
            <div key={row.program} className="flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50">
              <span className="font-medium text-slate-900">{row.program}</span>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <span>{row.duration}</span>
                <span className="font-bold text-slate-900 w-16 text-right">{row.cost}</span>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-4">Payment Options</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {[
            { title: 'Pay in Full', desc: 'One-time payment at enrollment. No additional fees.' },
            { title: 'Payment Plan', desc: 'Weekly or monthly installments. Down payment required at enrollment.' },
            { title: 'Affirm Financing', desc: 'Apply for 0%–36% APR financing through Affirm. Subject to credit approval.' },
            { title: 'Sezzle', desc: 'Split tuition into 4 interest-free payments over 6 weeks.' },
          ].map((opt) => (
            <div key={opt.title} className="border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-slate-900">{opt.title}</h3>
              </div>
              <p className="text-sm text-slate-600">{opt.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <DollarSign className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Not Sure What You Qualify For?</h3>
          <p className="text-slate-600 mb-4 text-sm">Run a free eligibility check. Most students qualify for at least partial funding.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/check-eligibility" className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition text-sm">
              Check Eligibility
            </Link>
            <Link href="/tuition-fees" className="border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-100 transition text-sm">
              Full Fee Schedule
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
