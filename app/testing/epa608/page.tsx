import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Award, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'EPA 608 Universal Certification | Elevate Testing Center',
  description: 'Pass your EPA 608 Universal certification exam at Elevate Testing Center. Required for HVAC technicians working with refrigerants.',
};

const exams = [
  { name: 'EPA 608 Universal', code: '608-U', price: '$125', desc: 'Full universal certification - all types' },
  { name: 'EPA 608 Type I', code: '608-I', price: '$95', desc: 'Small appliances (<5 lbs)' },
  { name: 'EPA 608 Type II', code: '608-II', price: '$95', desc: 'High-pressure systems' },
  { name: 'EPA 608 Type III', code: '608-III', price: '$95', desc: 'Low-pressure systems' },
];

export default function EPA608Page() {
  return (
    <main className="min-h-screen">
      <section className="relative bg-brand-blue-900 text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/hvac-unit.webp" alt="EPA 608 certification testing" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'EPA 608' }]} />
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              <ShieldCheck className="w-4 h-4" /> EPA 608 Certified Testing
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">EPA 608 Universal Certification</h1>
            <p className="text-xl text-blue-200 max-w-2xl">
              Required certification for all HVAC technicians working with refrigerants. Get certified at Elevate.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-amber-900 mb-2">About EPA 608</h3>
            <p className="text-amber-800 text-sm">
              EPA Section 608 requires technicians who work with regulated refrigerants to be certified. 
              The Universal exam covers all three types plus CORE content.
            </p>
          </div>
          <h2 className="text-2xl font-bold mb-8">Available EPA 608 Exams</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <div key={exam.code} className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="text-xs text-slate-500 font-mono mb-1">{exam.code}</div>
                <h3 className="font-bold text-lg mb-1">{exam.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{exam.desc}</p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-black text-brand-red-600">{exam.price}</span>
                  <Link href="/testing/book" className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-red-700 transition">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 text-center bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black mb-4">Get EPA 608 Certified</h2>
          <p className="text-slate-600 mb-8">Book your exam at Elevate Testing Center today.</p>
          <Link href="/testing/book?type=epa608" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-red-700 transition">
            <CalendarDays className="w-5 h-5" /> Schedule Your Exam
          </Link>
        </div>
      </section>
    </main>
  );
}
