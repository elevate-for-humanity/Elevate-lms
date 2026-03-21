import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rise Up Foundation — Free VITA Tax Preparation',
  description:
    'Free tax preparation for qualifying individuals and families. IRS-certified volunteers file your federal and state returns at no cost through the VITA program. Indianapolis and surrounding areas.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation' },
  openGraph: {
    title: 'Rise Up Foundation — Free VITA Tax Help',
    description: 'IRS-certified volunteers prepare your taxes for free. No income limit surprises — see if you qualify.',
    url: 'https://www.supersonicfastermoney.com/tax/rise-up-foundation',
    type: 'website',
    images: [{ url: '/images/pages/subpage-tax-hero.jpg', width: 1200, height: 630 }],
  },
};

const SERVICES = [
  {
    title: 'Free Tax Preparation',
    description:
      'IRS-certified volunteers prepare your complete federal and state tax return at no charge. We handle W-2s, 1099s, EITC, Child Tax Credit, and most common deductions. Qualifying income limit is generally $67,000 or below.',
    image: '/images/pages/subpage-tax-hero.jpg',
    href: '/tax/rise-up-foundation/free-tax-help',
  },
  {
    title: 'VITA Site Locator',
    description:
      'Find a free tax preparation site near you. VITA sites operate at community centers, libraries, schools, and faith organizations throughout Indianapolis and surrounding counties. Hours vary by location.',
    image: '/images/pages/locations-page-1.jpg',
    href: '/tax/rise-up-foundation/site-locator',
  },
  {
    title: 'Required Documents',
    description:
      'Know exactly what to bring before your appointment. You will need photo ID, Social Security cards for all household members, all W-2 and 1099 forms, last year\'s return if available, and bank account information for direct deposit.',
    image: '/images/pages/admin-documents-hero.jpg',
    href: '/tax/rise-up-foundation/documents',
  },
  {
    title: 'Eligibility & FAQ',
    description:
      'Most individuals and families earning $67,000 or less qualify for free VITA tax preparation. Learn about income limits, what types of returns we can prepare, and what to expect at your appointment.',
    image: '/images/pages/faq-page-1.jpg',
    href: '/tax/rise-up-foundation/faq',
  },
  {
    title: 'Volunteer With Us',
    description:
      'Become an IRS-certified VITA volunteer. No tax background required — we provide full training through the IRS Link & Learn program. Volunteers commit to 4–6 hours per week during tax season (January through April).',
    image: '/images/pages/rise-foundation-page-3.jpg',
    href: '/tax/rise-up-foundation/volunteer',
  },
  {
    title: 'Volunteer Training',
    description:
      'Complete the IRS Link & Learn certification online at your own pace. Training covers individual tax law, quality review procedures, and intake interview skills. Certification is required before preparing any returns.',
    image: '/images/pages/admin-ferpa-training-hero.jpg',
    href: '/tax/rise-up-foundation/training',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Check Your Eligibility',
    description:
      'VITA services are available to individuals and families with income generally at or below $67,000. Most simple to moderately complex returns qualify. Self-employment with losses, rental income, and complex investments may not be eligible.',
    image: '/images/pages/admin-tax-apps-hero.jpg',
  },
  {
    number: '02',
    title: 'Gather Your Documents',
    description:
      'Bring a valid photo ID, Social Security cards or ITIN letters for everyone on the return, all income documents (W-2, 1099, SSA-1099), proof of any deductions, and your bank routing and account numbers for direct deposit.',
    image: '/images/pages/admin-documents-upload-hero.jpg',
  },
  {
    number: '03',
    title: 'Visit a VITA Site',
    description:
      'Walk in or schedule an appointment at a VITA site near you. An IRS-certified volunteer will conduct an intake interview, review your documents, and prepare your return. You review and sign before anything is filed.',
    image: '/images/pages/locations-page-1.jpg',
  },
  {
    number: '04',
    title: 'Receive Your Refund',
    description:
      'Your return is e-filed the same day at no cost. With direct deposit, most refunds arrive within 10–21 days. If you qualify for the Earned Income Tax Credit, your refund may be larger than you expect.',
    image: '/images/pages/admin-tax-reports-hero.jpg',
  },
];

export default function RiseUpFoundationPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* HERO — full bleed, no text overlay */}
      <section className="relative w-full h-[75vh] min-h-[500px]">
        <Image
          src="/images/pages/admin-ai-console-hero.jpg"
          alt="Rise Up Foundation free VITA tax preparation"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </section>

      {/* INTRO BAND */}
      <section className="border-b border-slate-100 py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-5">
            Rise Up Foundation
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-4 leading-relaxed">
            Free tax preparation for qualifying individuals and families through the IRS
            Volunteer Income Tax Assistance (VITA) program. IRS-certified volunteers
            prepare your complete federal and state return at no cost.
          </p>
          <p className="text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rise Up Foundation is a 501(c)(3) nonprofit organization operating independently
            from Supersonic Fast Cash paid tax services. All VITA services are provided by
            trained volunteers at zero cost to qualifying taxpayers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tax/rise-up-foundation/free-tax-help"
              className="px-10 py-4 bg-white text-emerald-900 font-bold text-lg rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Get Free Tax Help
            </Link>
            <Link
              href="/tax/rise-up-foundation/site-locator"
              className="px-10 py-4 bg-emerald-700 text-white font-bold text-lg rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Find a VITA Site
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO HERO */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                What Is VITA?
              </h2>
              <p className="text-lg text-slate-700 mb-5 leading-relaxed">
                The IRS Volunteer Income Tax Assistance program has helped millions of
                Americans file their taxes for free since 1971. Volunteers are trained
                and certified by the IRS to prepare basic to moderately complex returns.
              </p>
              <p className="text-slate-600 mb-5 leading-relaxed">
                Rise Up Foundation operates VITA sites in Indianapolis and surrounding
                communities. Every return is quality-reviewed by a second certified
                volunteer before filing. There are no hidden fees, no upsells, and no
                pressure to purchase any product.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                In addition to free filing, our volunteers screen every client for the
                Earned Income Tax Credit, Child Tax Credit, and other credits that
                many taxpayers miss when filing on their own.
              </p>
              <Link
                href="/tax/rise-up-foundation/free-tax-help"
                className="inline-block px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors"
              >
                See If You Qualify
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-200">
              <video
                src="/videos/tax-vita-overview.mp4"
                poster="/images/pages/tax-volunteer-hero.jpg"
                controls
                preload="metadata"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">What We Offer</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Free tax preparation, site locations, volunteer opportunities, and
              everything you need to get your taxes done at no cost.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col"
              >
                <div className="relative h-52 w-full flex-shrink-0">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1 bg-white">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1">
                    {service.description}
                  </p>
                  <Link
                    href={service.href}
                    className="mt-5 block w-full text-center py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              From eligibility check to refund — here is what to expect when you use
              a VITA site.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col">
                <div className="relative h-48 w-full rounded-xl overflow-hidden mb-5">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-700 text-white text-sm font-black px-3 py-1 rounded-lg">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VOLUNTEER CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[480px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/rise-foundation-page-4.jpg"
                alt="Become a VITA volunteer"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                Become a VITA Volunteer
              </h2>
              <p className="text-lg text-slate-600 mb-5 leading-relaxed">
                No tax background required. Rise Up Foundation provides complete training
                through the IRS Link & Learn certification program. You will learn
                individual tax law, how to conduct intake interviews, and quality review
                procedures — all online at your own pace.
              </p>
              <p className="text-slate-600 mb-5 leading-relaxed">
                Volunteers commit to 4–6 hours per week during tax season, which runs
                from late January through April 15. Sites are located throughout
                Indianapolis at community centers, libraries, and partner organizations.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Volunteering with VITA counts toward community service hours and provides
                hands-on experience that supports careers in accounting, finance, and
                social services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/tax/rise-up-foundation/volunteer"
                  className="px-8 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-colors text-center"
                >
                  Apply to Volunteer
                </Link>
                <Link
                  href="/tax/rise-up-foundation/training"
                  className="px-8 py-4 border-2 border-emerald-700 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-center"
                >
                  Start IRS Training
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NONPROFIT NOTICE */}
      <section className="py-12 bg-emerald-50 border-y border-emerald-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-48 rounded-xl overflow-hidden">
              <Image
                src="/images/pages/admin-tax-filing-hero.jpg"
                alt="Rise Up Foundation nonprofit"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                About Rise Up Foundation
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Rise Up Foundation is a 501(c)(3) nonprofit organization that operates
                independently from Supersonic Fast Cash paid tax preparation services.
                VITA services are funded through IRS grants and community partnerships.
                All services are provided by IRS-certified volunteers at zero cost to
                qualifying taxpayers. No products are sold at VITA sites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/pages/tax-preparation.jpg"
          alt="Free tax preparation Rise Up Foundation"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-emerald-900/75 flex items-center justify-center">
          <div className="text-center px-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Get Your Taxes Done Free
            </h2>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
              IRS-certified volunteers. No cost. No hidden fees. Find a site near you
              or schedule an appointment today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tax/rise-up-foundation/free-tax-help"
                className="px-10 py-4 bg-white text-emerald-900 font-black text-xl rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Get Free Help
              </Link>
              <Link
                href="/tax/rise-up-foundation/site-locator"
                className="px-10 py-4 bg-emerald-700 text-white font-black text-xl rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Find a Site
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DISCLOSURE */}
      <section className="py-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Rise Up Foundation VITA services are provided by IRS-certified volunteers.
            Income eligibility limits apply. Not all return types are eligible for VITA preparation.
            Rise Up Foundation is a 501(c)(3) nonprofit organization and operates independently
            from Supersonic Fast Cash paid tax preparation services.
          </p>
        </div>
      </section>

    </div>
  );
}
