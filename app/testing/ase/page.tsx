import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CalendarDays, Award, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ASE Certification Testing | Automotive Service Excellence | Elevate',
  description: 'Take ASE (Automotive Service Excellence) certification exams at Elevate Testing Center. NATEF-certified tests for automotive technicians.',
};

const exams = [
  { name: 'A1 - Engine Repair', code: 'A1', price: '$82' },
  { name: 'A4 - Suspension & Steering', code: 'A4', price: '$82' },
  { name: 'A5 - Brakes', code: 'A5', price: '$82' },
  { name: 'A6 - Electrical/Electronic Systems', code: 'A6', price: '$82' },
  { name: 'A7 - Heating & A/C', code: 'A7', price: '$82' },
  { name: 'A8 - Engine Performance', code: 'A8', price: '$82' },
];

export default function ASEPage() {
  return (
    <main className="min-h-screen">
      {/* Hero with gradient overlay */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0">
          <Image 
            src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/automotive-training.webp" 
            alt="ASE automotive certification" 
            fill 
            className="object-cover opacity-30" 
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4">
          <Breadcrumbs items={[{ label: 'Testing', href: '/testing' }, { label: 'ASE Certification' }]} />
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              <Award className="w-4 h-4" /> ASE Certified Testing
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Automotive Service Excellence</h1>
            <p className="text-xl text-slate-300 max-w-2xl">
              Get ASE certified to demonstrate your automotive repair and service expertise. Required by employers nationwide.
            </p>
          </div>
        </div>
      </section>

      {/* Exam List */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Available ASE Exams</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              ASE certifications are the industry standard for automotive technicians. Each exam costs $82 and is administered by Prometric on behalf of ASE.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div key={exam.code} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-mono">Exam {exam.code}</div>
                    <h3 className="font-bold text-lg">{exam.name}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <span className="text-2xl font-black text-brand-red-600">{exam.price}</span>
                  <Link href="/testing/book?type=ase" className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-red-700 transition">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Ready to Take Your ASE Exam?</h2>
          <p className="text-slate-600 mb-8">
            Schedule your exam at Elevate Testing Center. Bring a valid photo ID and arrive 15 minutes early.
          </p>
          <Link href="/testing/book?type=ase" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-red-700 transition">
            <CalendarDays className="w-5 h-5" /> Book Your ASE Exam
          </Link>
        </div>
      </section>
    </main>
  );
}
