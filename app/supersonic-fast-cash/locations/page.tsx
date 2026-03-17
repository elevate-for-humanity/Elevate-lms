import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import SupersonicPageHero from '@/components/supersonic/SupersonicPageHero';

export const metadata: Metadata = {
  title: 'Locations | Supersonic Fast Cash',
  description: 'Find a Supersonic Fast Cash tax preparation office near you. Indianapolis and surrounding areas. Walk-ins welcome.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/supersonic-fast-cash/locations' },
};

const LOCATIONS = [
  { name: 'Keystone Crossing — Main Office', address: '8888 Keystone Crossing, Suite 1300', city: 'Indianapolis, IN 46240', phone: '(317) 314-3757', hours: 'Mon–Fri 9am–8pm · Sat 9am–5pm · Sun 12pm–5pm', image: '/images/pages/supersonic-page-1.jpg' },
  { name: 'Eastside Indianapolis', address: '2524 N Arlington Ave', city: 'Indianapolis, IN 46218', phone: '(317) 314-3757', hours: 'Mon–Fri 10am–7pm · Sat 9am–4pm', image: '/images/pages/supersonic-page-10.jpg' },
  { name: 'Southside Indianapolis', address: '1802 Madison Ave', city: 'Indianapolis, IN 46225', phone: '(317) 314-3757', hours: 'Mon–Fri 10am–7pm · Sat 9am–3pm', image: '/images/pages/supersonic-page-11.jpg' },
  { name: 'Northwest Indianapolis', address: '3901 Lafayette Rd', city: 'Indianapolis, IN 46254', phone: '(317) 314-3757', hours: 'Tue–Fri 11am–7pm · Sat 9am–4pm', image: '/images/pages/supersonic-page-12.jpg' },
];

const STATES = [
  { label: 'Indiana', href: '/supersonic-fast-cash/tax-preparation-indiana', image: '/images/pages/supersonic-page-10.jpg' },
  { label: 'Illinois', href: '/supersonic-fast-cash/tax-preparation-illinois', image: '/images/pages/supersonic-page-11.jpg' },
  { label: 'Ohio', href: '/supersonic-fast-cash/tax-preparation-ohio', image: '/images/pages/supersonic-page-12.jpg' },
  { label: 'Tennessee', href: '/supersonic-fast-cash/tax-preparation-tennessee', image: '/images/pages/supersonic-fast-cash-page-1.jpg' },
  { label: 'Texas', href: '/supersonic-fast-cash/tax-preparation-texas', image: '/images/pages/supersonic-tax.jpg' },
];

export default function LocationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SupersonicPageHero
        image="/images/pages/supersonic-page-4.jpg"
        alt="Supersonic Fast Cash office locations"
        title="Our Locations"
        subtitle="Walk-ins welcome. Appointments recommended during peak tax season (January–April)."
      />

      {/* LOCATIONS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Indianapolis Offices</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Four locations across Indianapolis. All offices offer full tax preparation, refund advances, and document upload services.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {LOCATIONS.map((loc) => (
              <div key={loc.name} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-52 flex-shrink-0">
                  <Image src={loc.image} alt={loc.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                <div className="p-6 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 text-lg mb-4">{loc.name}</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Address', value: `${loc.address}, ${loc.city}`, image: '/images/pages/locations-page-1.jpg' },
                      { label: 'Phone', value: loc.phone, image: '/images/pages/contact-page-1.jpg' },
                      { label: 'Hours', value: loc.hours, image: '/images/pages/calendar-page-1.jpg' },
                    ].map((item) => (
                      <div key={item.label} className="flex gap-3 items-start">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={item.image} alt={item.label} fill className="object-cover" sizes="40px" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</p>
                          <p className="text-slate-900 text-sm font-medium">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/supersonic-fast-cash/book-appointment" className="mt-5 block w-full text-center py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors">
                    Book at This Location
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATE AREAS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Service Areas by State</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">We serve clients in five states. Select your state for local VITA sites and tax preparation locations.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {STATES.map((state) => (
              <Link key={state.label} href={state.href} className="group rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-300">
                <div className="relative h-32">
                  <Image src={state.image} alt={state.label} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 20vw" />
                </div>
                <div className="p-3 bg-white">
                  <p className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors text-sm">{state.label} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/supersonic-page-5.jpg" alt="Book your tax appointment" fill className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Book Your Appointment</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/supersonic-fast-cash/book-appointment" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">Book Now</Link>
              <a href="tel:+13173143757" className="px-10 py-4 bg-white text-slate-900 font-black text-xl rounded-xl hover:bg-slate-100 transition-colors">(317) 314-3757</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
