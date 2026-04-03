import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Phone } from 'lucide-react';
import OrientationScheduleClient from './OrientationScheduleClient';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/orientation/schedule' },
  title: 'Schedule Orientation | Elevate For Humanity',
  description: 'Schedule a virtual orientation session or a barbershop walk-through. Sessions are 2 hours apart and added to Google Calendar automatically.',
};

export default function OrientationSchedulePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Orientation', href: '/orientation' }, { label: 'Schedule' }]} />
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
          <Image
            src="/images/pages/orientation-page-2.jpg"
            alt="Orientation session"
            fill className="object-cover" priority sizes="100vw"
          />
        </div>
        <div className="bg-white border-t py-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-black text-black mb-3">Schedule Your Session</h1>
          <p className="text-black text-lg max-w-2xl mx-auto">
            Virtual orientations and barbershop walk-throughs are available by appointment.
            Pick your session type below — you'll receive a Google Calendar invite with a Zoom link.
          </p>
        </div>
      </section>

      {/* Scheduler */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <OrientationScheduleClient />
        </div>
      </section>

      {/* What to bring */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-black mb-6 text-center">What to Have Ready</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Government-issued photo ID',
              'Proof of Indiana residency (utility bill or lease)',
              'Proof of income (if applying for WIOA funding)',
              'Any prior transcripts or certifications',
            ].map((item) => (
              <div key={item} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-black font-medium text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 bg-slate-900 text-center px-4">
        <h2 className="text-2xl font-black text-white mb-3">Prefer to Call?</h2>
        <p className="text-white mb-6">Our team can schedule your session over the phone in under 2 minutes.</p>
        <a
          href="tel:3173143757"
          className="inline-flex items-center gap-2 bg-white text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors text-lg"
        >
          <Phone className="w-5 h-5" /> (317) 314-3757
        </a>
      </section>
    </div>
  );
}
