import { Metadata } from 'next';
import Link from 'next/link';
import { Store, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const metadata: Metadata = {
  title: 'Booth Rental Interest | Elevate',
  keywords: ['booth rental', 'beauty', 'salon', 'licensed professional'],
  description: 'Request information about booth-rental or workspace opportunities for licensed beauty professionals.',
};

export default function BoothRentalApplyPage() {
  const benefits = [
    { icon: Store, title: 'Professional Environment', desc: 'Discuss available workspace, equipment expectations, and facility policies with the Elevate team.' },
    { icon: Calendar, title: 'Scheduling Options', desc: 'Availability and scheduling are reviewed based on the facility, services, and current space.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/barber-shop-interior.webp"
        alt="Licensed beauty professional workspace"
        eyebrow="Beauty Workspace"
        title="Booth Rental & Workspace Interest"
        description="Licensed beauty professionals can request information about available workspace. Terms, availability, permitted services, insurance, and facility requirements are reviewed before any agreement."
        actions={(
          <>
            <Link href="/contact?topic=booth-rental" className="inline-flex items-center rounded-lg bg-brand-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-brand-red-700">Request Booth Information <ArrowRight className="ml-2 h-4 w-4" /></Link>
            <Link href="/booth-rental" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-7 py-3 font-bold text-slate-900 transition-colors hover:border-slate-500">Learn More</Link>
          </>
        )}
      />

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-center text-2xl font-bold text-slate-950 md:text-3xl">Before You Request Space</h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-slate-700">Workspace availability and terms are not assumed. Elevate reviews the professional license, services, insurance, scheduling needs, and facility fit first.</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <b.icon className="mb-4 h-8 w-8 text-brand-blue-700" />
                <h3 className="mb-2 font-bold text-slate-950">{b.title}</h3>
                <p className="text-sm leading-6 text-slate-700">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center text-xl font-bold text-slate-950">Information We May Verify</h2>
          <div className="space-y-3">
            {[
              'Current professional license appropriate to the services offered',
              'Liability insurance and any facility-required coverage',
              'Requested services, schedule, and workspace needs',
              'Professional conduct, sanitation, safety, and facility policies',
            ].map((req) => (
              <div key={req} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-700" />
                <span className="text-sm text-slate-800">{req}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/contact?topic=booth-rental" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-8 py-4 font-bold text-white hover:bg-brand-blue-800">Contact Elevate About Space <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
