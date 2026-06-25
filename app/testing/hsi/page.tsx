import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'HSI CPR & First Aid Certifications | Elevate Testing Center',
  description: 'HSI CPR, AED, and First Aid certification exams tested at Elevate Testing Center.',
};

const exams = [
  { name: 'CPR / AED', code: 'HSI-CPR', price: '$65' },
  { name: 'First Aid', code: 'HSI-FA', price: '$65' },
  { name: 'CPR / AED / First Aid Combo', code: 'HSI-COMB', price: '$95' },
  { name: 'Bloodborne Pathogens', code: 'HSI-BBP', price: '$45' },
];

export default function HSIPage() {
  return (
    <main className="min-h-screen">
      <section className="relative bg-brand-blue-900 text-white py-20">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/programs-emergency-health-safety-hero.webp" alt="Health and Safety Institute testing" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'HSI Certifications' }]} />
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 bg-brand-red-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              <Award className="w-4 h-4" /> HSI Certifications
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">HSI CPR & First Aid</h1>
            <p className="text-xl text-blue-200 max-w-2xl">
              HSI certification exams for emergency response and workplace safety.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Available HSI Exams</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <h2 className="text-3xl font-black mb-4">Get Certified in CPR & First Aid</h2>
          <Link href="/testing/book?type=hsi" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-red-700 transition">
            <CalendarDays className="w-5 h-5" /> Book Your Exam
          </Link>
        </div>
      </section>
    </main>
  );
}
