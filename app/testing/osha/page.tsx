import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Award, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'OSHA 10 & 30 Hour Training | Elevate Testing Center',
  description: 'OSHA 10 and 30 hour outreach training certifications. Construction and General Industry.',
};

const exams = [
  { name: 'OSHA 10 Hour Construction', code: 'OSHA-10C', price: '$95', desc: 'Entry-level construction safety' },
  { name: 'OSHA 10 Hour General Industry', code: 'OSHA-10G', price: '$95', desc: 'Entry-level general industry safety' },
  { name: 'OSHA 30 Hour Construction', code: 'OSHA-30C', price: '$195', desc: 'Supervisor-level construction safety' },
  { name: 'OSHA 30 Hour General Industry', code: 'OSHA-30G', price: '$195', desc: 'Supervisor-level general industry' },
];

export default function OSHAPage() {
  return (
    <main className="min-h-screen">
      <section className="relative bg-brand-blue-900 text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/skilled-trades-hero.webp" alt="OSHA training" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'OSHA' }]} />
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              <ShieldCheck className="w-4 h-4" /> OSHA Training
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">OSHA 10 & 30 Hour Training</h1>
            <p className="text-xl text-blue-200 max-w-2xl">
              OSHA outreach training for construction and general industry safety certifications.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-blue-900 mb-2">About OSHA Outreach Training</h3>
            <p className="text-blue-800 text-sm">
              OSHA 10 and 30 hour outreach training courses are designed to provide workers with safety awareness. 
              Upon completion, you receive an OSHA DOL card.
            </p>
          </div>
          <h2 className="text-2xl font-bold mb-8">Available OSHA Training</h2>
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
          <h2 className="text-3xl font-black mb-4">Get OSHA Certified</h2>
          <p className="text-slate-600 mb-8">Book your OSHA training course today.</p>
          <Link href="/testing/book?type=osha" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-red-700 transition">
            <CalendarDays className="w-5 h-5" /> Schedule Training
          </Link>
        </div>
      </section>
    </main>
  );
}
