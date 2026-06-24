import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ACT WorkKeys & NCRC Testing | Elevate',
  description: 'Take ACT WorkKeys and NCRC assessments at Elevate Testing Center. NCRC credentials for career readiness.',
};

const exams = [
  { name: 'Applied Math', code: 'AM', price: '$55' },
  { name: 'Graphic Literacy', code: 'GL', price: '$55' },
  { name: 'Workplace Documents', code: 'WD', price: '$55' },
  { name: 'NCRC Gold', code: 'BRONZE-SILVER-GOLD', price: '$35' },
  { name: 'Full NCRC Bundle', code: 'ALL-3', price: '$150' },
];

export default function WorkKeysPage() {
  return (
    <main className="min-h-screen">
      <section className="relative bg-brand-blue-900 text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/career-services-page-1.webp" alt="WorkKeys certification testing" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'ACT WorkKeys' }]} />
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              <Award className="w-4 h-4" /> ACT WorkKeys
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">ACT WorkKeys & NCRC Assessments</h1>
            <p className="text-xl text-blue-200 max-w-2xl">
              Prove your workplace skills with NCRC credentials recognized by employers nationwide.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Available WorkKeys Exams</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div key={exam.code} className="bg-white rounded-xl border p-6 shadow-sm">
                <div className="text-xs text-slate-500 font-mono mb-2">{exam.code}</div>
                <h3 className="font-bold text-lg mb-2">{exam.name}</h3>
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
          <h2 className="text-3xl font-black mb-4">Ready to Test?</h2>
          <Link href="/testing/book?type=workkeys" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-red-700 transition">
            <CalendarDays className="w-5 h-5" /> Book Your Assessment
          </Link>
        </div>
      </section>
    </main>
  );
}
