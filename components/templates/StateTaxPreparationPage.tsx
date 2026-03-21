import Link from 'next/link';
import Image from 'next/image';
import { StateConfig, getOtherStates } from '@/config/states';

// State hero images — one per state, fallback to generic tax image
const STATE_HERO: Record<string, string> = {
  indiana:   '/images/pages/supersonic-page-10.jpg',
  illinois:  '/images/pages/supersonic-page-11.jpg',
  ohio:      '/images/pages/supersonic-page-12.jpg',
  tennessee: '/images/pages/supersonic-fast-cash-page-1.jpg',
  texas:     '/images/pages/supersonic-tax.jpg',
};

const STATE_FEATURE_IMAGES = [
  '/images/pages/supersonic-tax-prep.jpg',
  '/images/pages/supersonic-page-2.jpg',
  '/images/pages/supersonic-page-3.jpg',
  '/images/pages/supersonic-page-4.jpg',
];

const OTHER_STATE_IMAGES: Record<string, string> = {
  indiana:   '/images/pages/supersonic-page-10.jpg',
  illinois:  '/images/pages/supersonic-page-11.jpg',
  ohio:      '/images/pages/supersonic-page-12.jpg',
  tennessee: '/images/pages/supersonic-fast-cash-page-1.jpg',
  texas:     '/images/pages/supersonic-tax.jpg',
};

interface Props {
  state: StateConfig;
}

export default function StateTaxPreparationPage({ state }: Props) {
  const otherStates = getOtherStates(state.slug);
  const heroImage = STATE_HERO[state.slug] ?? '/images/pages/subpage-tax-hero.jpg';

  return (
    <div className="min-h-screen bg-white">

      {/* HERO — full bleed, no text overlay */}
      <section className="relative w-full h-[75vh] min-h-[500px]">
        <Image
          src={heroImage}
          alt={`Tax preparation in ${state.name}`}
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </section>

      {/* INTRO BAND */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
            {state.taxPreparation.headline}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            {state.taxPreparation.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/book-appointment"
              className="px-10 py-4 bg-brand-red-600 text-white font-bold text-lg rounded-xl hover:bg-brand-red-700 transition-colors"
            >
              Book Appointment
            </Link>
            <Link
              href="/supersonic-fast-cash/apply"
              className="px-10 py-4 bg-white text-slate-900 font-bold text-lg rounded-xl hover:bg-slate-100 transition-colors"
            >
              Apply Online
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES — photo cards, no icons */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              Why Choose Our {state.name} Tax Services
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Professional tax preparation and free VITA services for {state.demonym}.
              Every return reviewed for accuracy before filing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {state.taxPreparation.features.map((feature, i) => (
              <div key={feature} className="rounded-2xl overflow-hidden border border-slate-200 flex flex-col">
                <div className="relative h-40 w-full flex-shrink-0">
                  <Image
                    src={STATE_FEATURE_IMAGES[i % STATE_FEATURE_IMAGES.length]}
                    alt={feature}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <div className="p-5 flex-1 bg-white">
                  <p className="font-bold text-slate-900 leading-snug">{feature}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ELIGIBILITY */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[420px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/supersonic-tax-cert.jpg"
                alt={`Who qualifies for free tax preparation in ${state.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                Who Qualifies for Free Tax Preparation?
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                The IRS Volunteer Income Tax Assistance (VITA) program provides free tax
                preparation to qualifying individuals and families in {state.name}.
                Most people earning $67,000 or less per year are eligible.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: 'Income Limit', value: '$67,000 or below', image: '/images/pages/finance-accounting.jpg' },
                  { label: 'Service Cost', value: 'Completely free', image: '/images/pages/supersonic-page-6.jpg' },
                  { label: 'Volunteers', value: 'IRS-certified', image: '/images/pages/admin-tax-training-hero.jpg' },
                  { label: 'Filing', value: 'Federal + state', image: '/images/pages/admin-tax-filing-hero.jpg' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl overflow-hidden border border-slate-200">
                    <div className="relative h-24">
                      <Image src={item.image} alt={item.label} fill className="object-cover" sizes="200px" />
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                      <p className="font-bold text-slate-900 text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/tax/rise-up-foundation/faq"
                className="inline-block px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">
              VITA Locations in {state.name}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Free tax preparation sites operate at community centers, libraries, and
              partner organizations throughout {state.name}.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {state.majorCities.map((city, i) => (
              <div key={city} className="rounded-xl overflow-hidden border border-slate-200">
                <div className="relative h-28">
                  <Image
                    src={STATE_FEATURE_IMAGES[i % STATE_FEATURE_IMAGES.length]}
                    alt={city}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-3 bg-white">
                  <p className="font-bold text-slate-900 text-sm">{city}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="https://www.supersonicfastermoney.com/tax"
            className="text-brand-red-600 font-semibold hover:underline"
          >
            View all {state.name} locations →
          </Link>
        </div>
      </section>

      {/* OTHER STATES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Tax Services in Other States</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Supersonic Fast Cash and Rise Up Foundation VITA services are available
              across five states.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {otherStates.map((s) => (
              <Link
                key={s.slug}
                href={`/supersonic-fast-cash/tax-preparation-${s.slug}`}
                className="group rounded-2xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-36">
                  <Image
                    src={OTHER_STATE_IMAGES[s.slug] ?? '/images/pages/supersonic-tax.jpg'}
                    alt={`Tax preparation in ${s.name}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-4 bg-white">
                  <p className="font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                    {s.name}
                  </p>
                  <p className="text-sm text-slate-500">Tax preparation →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/pages/supersonic-page-5.jpg"
          alt={`Get your taxes done in ${state.name}`}
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
          <div className="text-center px-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to File in {state.name}?
            </h2>
            <p className="text-xl text-slate-200 mb-8 leading-relaxed">
              Professional paid preparation or free VITA services — we have an option for every {state.demonym}.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/supersonic-fast-cash/apply"
                className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/tax/rise-up-foundation/free-tax-help"
                className="px-10 py-4 bg-white text-slate-900 font-black text-xl rounded-xl hover:bg-slate-100 transition-colors"
              >
                Free VITA Help
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DISCLOSURE */}
      <section className="py-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            VITA services are provided by IRS-certified volunteers at no cost to qualifying taxpayers.
            Income eligibility limits apply. Supersonic Fast Cash professional tax preparation services
            are separate from VITA and are subject to standard fees. All preparers are PTIN-credentialed.
          </p>
        </div>
      </section>

    </div>
  );
}
