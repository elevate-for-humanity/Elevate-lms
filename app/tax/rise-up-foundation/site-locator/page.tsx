import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import VITAPageHero from '@/components/supersonic/VITAPageHero';

export const metadata: Metadata = {
  title: 'VITA Site Locator | Rise Up Foundation Free Tax Help',
  description: 'Find a free VITA tax preparation site near you in Indianapolis and surrounding communities. IRS-certified volunteers. No cost.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation/site-locator' },
};

const SITES = [
  { name: 'Keystone Crossing Community Center', address: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240', hours: 'Mon–Fri 9am–6pm, Sat 9am–3pm', image: '/images/pages/locations-page-1.jpg' },
  { name: 'Eastside Community Library', address: '2524 N Arlington Ave, Indianapolis, IN 46218', hours: 'Tue & Thu 4pm–8pm, Sat 10am–2pm', image: '/images/pages/supersonic-page-10.jpg' },
  { name: 'Southside Family Resource Center', address: '1802 Madison Ave, Indianapolis, IN 46225', hours: 'Mon & Wed 10am–4pm, Sat 9am–1pm', image: '/images/pages/supersonic-page-11.jpg' },
  { name: 'Northwest Community Hub', address: '3901 Lafayette Rd, Indianapolis, IN 46254', hours: 'Tue & Fri 1pm–7pm', image: '/images/pages/supersonic-page-12.jpg' },
];

export default function SiteLocatorPage() {
  return (
    <div className="min-h-screen bg-white">
      <VITAPageHero
        image="/images/pages/locations-page-1.jpg"
        alt="Find a free VITA tax site near you"
        title="Find a Free VITA Tax Site"
        subtitle="IRS-certified volunteers prepare your taxes for free at community locations throughout Indianapolis."
      />

      {/* SITES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-4">VITA Sites Near You</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">Walk-ins welcome at most sites. Appointments recommended during peak season (February–April). Call ahead to confirm hours.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {SITES.map((site) => (
              <div key={site.name} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-52 flex-shrink-0">
                  <Image src={site.image} alt={site.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                <div className="p-6 flex-1 bg-white">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{site.name}</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src="/images/pages/admin-analytics.jpg" alt="Address" fill className="object-cover" sizes="40px" />
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{site.address}</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src="/images/pages/locations.jpg" alt="Hours" fill className="object-cover" sizes="40px" />
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{site.hours}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IRS LOCATOR */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[380px] rounded-2xl overflow-hidden">
              <Image src="/images/pages/supersonic-page-4.jpg" alt="Find VITA sites nationwide" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">Find Sites Nationwide</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">The IRS VITA site locator tool covers thousands of free tax preparation sites across the country. If you are outside Indianapolis, use the IRS tool to find the nearest site to you.</p>
              <p className="text-slate-600 mb-8 leading-relaxed">Sites are available in all 50 states, typically operating from late January through April 15. Some sites operate year-round for amended returns and prior year filings.</p>
              <a href="https://irs.treasury.gov/freetaxprep/" target="_blank" rel="noopener noreferrer" className="inline-block px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors">
                IRS Free Tax Site Locator →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative h-[45vh] min-h-[320px]">
        <Image src="/images/pages/admin-ai-tutor-logs-hero.jpg" alt="Get free tax help" fill className="object-cover object-center" sizes="100vw" />
      </section>
      <section className="bg-emerald-900 py-12 text-center px-4">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to File for Free?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/tax/rise-up-foundation/documents" className="px-10 py-4 bg-white text-emerald-900 font-black text-xl rounded-xl hover:bg-emerald-50 transition-colors">What to Bring</Link>
          <Link href="/tax/rise-up-foundation/faq" className="px-10 py-4 bg-emerald-700 text-white font-black text-xl rounded-xl hover:bg-emerald-600 transition-colors border border-emerald-500">Check Eligibility</Link>
        </div>
      </section>
    </div>
  );
}
