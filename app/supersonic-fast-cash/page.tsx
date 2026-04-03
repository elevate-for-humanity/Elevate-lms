import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Supersonic Fast Cash | Tax Preparation & Refund Advance',
  description:
    'Professional tax preparation, same-day refund advances up to $7,500, DIY filing, audit protection, bookkeeping, and payroll. PTIN-credentialed preparers. Indianapolis, IN.',
  alternates: { canonical: 'https://www.supersonicfastermoney.com' },
  openGraph: {
    title: 'Supersonic Fast Cash — Get Your Refund Today',
    description: 'Professional tax prep and same-day refund advances up to $7,500.',
    url: 'https://www.supersonicfastermoney.com',
    type: 'website',
    images: [{ url: '/images/pages/tax-main-hero.jpg', width: 1200, height: 630 }],
  },
};

const SERVICES = [
  {
    title: 'Professional Tax Preparation',
    description:
      'Our PTIN-credentialed tax professionals prepare your federal and state returns accurately and on time. We handle W-2s, 1099s, self-employment income, rental properties, and more. Every return is reviewed for maximum credits and deductions before filing.',
    image: '/images/pages/tax-preparation.jpg',
    href: '/supersonic-fast-cash/services/tax-preparation',
    cta: 'Get Started',
  },
  {
    title: 'Same-Day Refund Advance',
    description:
      'Get up to $7,500 the same day your return is accepted — with zero interest and no hidden fees. Funds loaded to a prepaid card or direct deposit. Available to qualifying filers. Repaid automatically from your IRS refund.',
    image: '/images/pages/supersonic-page-2.jpg',
    href: '/supersonic-fast-cash/services/refund-advance',
    cta: 'See If You Qualify',
  },
  {
    title: 'DIY Tax Software',
    description:
      'File your own taxes with our guided tax software. The step-by-step interview walks you through every section — import your W-2 directly, auto-fill common forms, and e-file in minutes. Free federal filing available for qualifying returns.',
    image: '/images/pages/tax-self-prep-hero.jpg',
    href: '/supersonic-fast-cash/diy-taxes',
    cta: 'Start Filing Free',
  },
  {
    title: 'Audit Protection',
    description:
      'If the IRS or state tax authority audits your return, our team represents you at no additional cost. We respond to notices, gather documentation, and attend hearings on your behalf. Included with all professionally prepared returns.',
    image: '/images/pages/supersonic-page-4.jpg',
    href: '/supersonic-fast-cash/services/audit-protection',
    cta: 'Learn More',
  },
  {
    title: 'Bookkeeping',
    description:
      'Monthly bookkeeping for small businesses and self-employed individuals. We reconcile accounts, categorize transactions, generate profit and loss statements, and prepare your books for tax season. QuickBooks and Wave compatible.',
    image: '/images/pages/admin-finance.jpg',
    href: '/supersonic-fast-cash/services/bookkeeping',
    cta: 'Get a Quote',
  },
  {
    title: 'Payroll Services',
    description:
      'Full-service payroll processing for businesses with 1 to 50 employees. We handle direct deposit, tax withholding, quarterly filings, W-2 and 1099 generation, and year-end reporting. Flat monthly pricing with no per-employee surprises.',
    image: '/images/pages/bookkeeping.jpg',
    href: '/supersonic-fast-cash/services/payroll',
    cta: 'Get a Quote',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Gather Your Documents',
    description:
      "Bring your W-2s, 1099s, Social Security numbers for all dependents, last year's return if available, and any deduction records. Not sure what you need? Our team will walk you through the checklist when you arrive or call.",
    image: '/images/pages/tax-forms.jpg',
  },
  {
    number: '02',
    title: 'Meet With a Tax Pro',
    description:
      'Sit down with one of our PTIN-credentialed preparers in person or upload your documents online. We review your situation, identify every credit and deduction you qualify for, and prepare your return while you wait.',
    image: '/images/pages/tax-prep-desk.jpg',
  },
  {
    number: '03',
    title: 'Review and Sign',
    description:
      "We walk you through your completed return line by line before you sign. You'll see exactly what was filed, what you owe or are owed, and why. No surprises. No pressure. You approve everything before it goes to the IRS.",
    image: '/images/pages/supersonic-page-8.jpg',
  },
  {
    number: '04',
    title: 'Get Your Money',
    description:
      'E-file is submitted the same day. If you qualify for a refund advance, funds are available within 15 minutes of IRS acceptance. Standard refunds typically arrive within 10–21 days. Direct deposit is fastest.',
    image: '/images/pages/supersonic-page-9.jpg',
  },
];

const STATE_PAGES = [
  { label: 'Indiana',   href: '/supersonic-fast-cash/tax-preparation-indiana',   image: '/images/pages/supersonic-page-10.jpg' },
  { label: 'Illinois',  href: '/supersonic-fast-cash/tax-preparation-illinois',  image: '/images/pages/supersonic-page-11.jpg' },
  { label: 'Ohio',      href: '/supersonic-fast-cash/tax-preparation-ohio',      image: '/images/pages/supersonic-page-12.jpg' },
  { label: 'Tennessee', href: '/supersonic-fast-cash/tax-preparation-tennessee', image: '/images/pages/supersonic-fast-cash-page-1.jpg' },
  { label: 'Texas',     href: '/supersonic-fast-cash/tax-preparation-texas',     image: '/images/pages/supersonic-tax.jpg' },
];

export default function SupersonicFastCashPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* HERO — full bleed, no text overlay */}
      <section className="relative w-full h-[75vh] min-h-[500px]">
        <Image
          src="/images/pages/supersonic-page-3.jpg"
          alt="Supersonic Fast Cash tax preparation office"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
      </section>

      {/* INTRO BAND — white background, dark text */}
      <section className="py-16 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-5">
            Supersonic Fast Cash
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Tax software you can use yourself — or let our PTIN-credentialed professionals
            handle it for you. Same-day refund advances up to $7,500, audit protection,
            bookkeeping, and payroll. Serving Indiana, Illinois, Ohio, Tennessee, and Texas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/supersonic-fast-cash/diy-taxes"
              className="px-10 py-4 bg-brand-red-600 text-white font-bold text-lg rounded-xl hover:bg-brand-red-700 transition-colors"
            >
              File Your Own Taxes Free
            </Link>
            <Link
              href="/supersonic-fast-cash/apply"
              className="px-10 py-4 bg-slate-900 text-white font-bold text-lg rounded-xl hover:bg-slate-800 transition-colors"
            >
              Have a Pro File For You
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO SECTION — light background */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
                Two Ways to File — You Choose
              </h2>
              <p className="text-lg text-slate-700 mb-5 leading-relaxed">
                Use our tax software to file on your own — step-by-step, at your own pace,
                from any device. Or bring your documents to one of our offices and let a
                PTIN-credentialed professional handle everything while you wait.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Either way, you get the same accuracy, the same maximum refund guarantee,
                and the same same-day refund advance of up to $7,500 when your return
                is accepted by the IRS.
              </p>
              <Link
                href="/supersonic-fast-cash/diy-taxes"
                className="inline-block px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
              >
                Try the Software Free
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-200">
              <video
                src="/videos/supersonic-intro-narrated.mp4"
                poster="/images/pages/tax-prep-desk.jpg"
                controls
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES — white background, plain cards with single button */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Our Services</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              From simple W-2 returns to complex self-employment filings, we handle every
              tax situation with the same level of care and expertise.
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
                    className="mt-5 block w-full text-center py-3 px-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
                  >
                    {service.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — light grey background */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              Whether you use our software or come in to see a pro, the process is the same four steps — and most people are done in under an hour.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col">
                <div className="relative h-48 w-full rounded-xl overflow-hidden mb-4">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <div className="w-8 h-8 bg-brand-red-600 text-white text-sm font-black rounded-lg flex items-center justify-center mb-2">{step.number}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REFUND ADVANCE — white background */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[480px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/supersonic-tax-cert.jpg"
                alt="Same-day refund advance up to $7,500"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                Same-Day Refund Advance — Up to $7,500
              </h2>
              <p className="text-lg text-slate-700 mb-5 leading-relaxed">
                Don't wait 10–21 days for the IRS. Qualifying filers can receive a refund
                advance the same day their return is accepted — with zero interest and no
                loan fees. Funds are loaded to a prepaid Visa card or sent via direct deposit.
              </p>
              <p className="text-slate-600 mb-5 leading-relaxed">
                The advance is repaid automatically when your actual IRS refund arrives.
                There is no out-of-pocket cost to you. Advance amounts range from $500 to
                $7,500 depending on your expected refund and eligibility.
              </p>
              <p className="text-slate-500 text-sm mb-8">
                Refund advance is a financial product offered by a lending partner.
                Approval is subject to eligibility requirements. Not available in all states.
              </p>
              <Link
                href="/supersonic-fast-cash/services/refund-advance"
                className="inline-block px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
              >
                See If You Qualify
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LEARN VIDEO — light background */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            See How the Software Works
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Watch a walkthrough of the Supersonic Fast Cash tax software — from entering
            your W-2 to claiming your credits and e-filing directly to the IRS. Most
            returns take under 30 minutes.
          </p>
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-200 max-w-3xl mx-auto mb-8">
            <video
              src="/videos/supersonic-marketing-narrated.mp4"
              poster="/images/pages/tax-self-prep-hero.jpg"
              controls
              playsInline
              preload="none"
              className="w-full h-full object-cover"
            />
          </div>
          <Link
            href="/supersonic-fast-cash/diy-taxes"
            className="inline-block px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
          >
            Start Filing Free
          </Link>
        </div>
      </section>

      {/* LOCATION — white background */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                Visit Us in Indianapolis
              </h2>
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                Our main office is located at Keystone Crossing in Indianapolis.
                Walk-ins are welcome during business hours. Appointments are recommended
                during peak tax season (January through April) to minimize wait times.
              </p>
              <div className="space-y-5 mb-8">
                {[
                  { label: 'Address', value: '8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240', image: '/images/pages/locations-page-1.jpg' },
                  { label: 'Hours', value: 'Mon–Fri 9am–8pm · Sat 9am–5pm · Sun 12pm–5pm', image: '/images/pages/calendar-page-1.jpg' },
                  { label: 'Phone', value: '(317) 314-3757', image: '/images/pages/contact-page-1.jpg' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.label} fill className="object-cover" sizes="56px" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
                      {item.label === 'Phone' ? (
                        <a href="tel:+13173143757" className="text-brand-red-600 font-bold text-lg hover:underline">{item.value}</a>
                      ) : (
                        <p className="text-slate-900 font-medium">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/supersonic-fast-cash/locations" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-center">
                  All Locations
                </Link>
                <Link href="/supersonic-fast-cash/book-appointment" className="px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors text-center">
                  Book Appointment
                </Link>
              </div>
            </div>
            <div className="relative h-[480px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/tax-hero.jpg"
                alt="Supersonic Fast Cash Indianapolis office"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* STATE SERVICE AREAS — light grey */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Service Areas</h2>
            <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
              We prepare federal and state returns for clients in five states. Select your
              state for local tax information, VITA site locations, and state-specific credits.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {STATE_PAGES.map((state) => (
              <div key={state.label} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
                <div className="relative h-36 w-full">
                  <Image
                    src={state.image}
                    alt={`Tax preparation in ${state.label}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 20vw"
                  />
                </div>
                <div className="p-4 bg-white flex-1 flex flex-col">
                  <p className="font-bold text-slate-900 mb-3">{state.label}</p>
                  <Link
                    href={state.href}
                    className="mt-auto block w-full text-center py-2 bg-brand-red-600 text-white font-bold text-sm rounded-lg hover:bg-brand-red-700 transition-colors"
                  >
                    View State
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BECOME A TAX PRO — white */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                Become a Certified Tax Preparer
              </h2>
              <p className="text-lg text-slate-700 mb-5 leading-relaxed">
                Supersonic Fast Cash offers a full tax preparer training program for
                individuals who want to start a career in tax preparation. The program
                covers individual and business returns, IRS e-file procedures, refund
                products, and client service.
              </p>
              <p className="text-slate-600 mb-5 leading-relaxed">
                Graduates receive PTIN registration, IRS e-file authorization, and the
                option to join the Supersonic Fast Cash preparer network. Training is
                available in-person and online. No prior experience required.
              </p>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Funding may be available for qualifying participants through WIOA and
                other workforce programs offered through Elevate for Humanity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/supersonic-fast-cash/training" className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-center">
                  View Training Program
                </Link>
                <Link href="/supersonic-fast-cash/careers" className="px-8 py-4 border-2 border-slate-900 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors text-center">
                  Join Our Team
                </Link>
              </div>
            </div>
            <div className="relative h-[480px] rounded-2xl overflow-hidden">
              <Image
                src="/images/pages/supersonic-training-hero.jpg"
                alt="Tax preparer training program"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA — full bleed image with overlay */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image
          src="/images/pages/tax-page-1.jpg"
          alt="Get your tax refund today"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
          <div className="text-center px-4 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Get Your Money?
            </h2>
            <p className="text-xl text-slate-200 mb-8 leading-relaxed">
              Apply now. Most clients receive their refund advance within 15 minutes
              of IRS acceptance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/supersonic-fast-cash/apply" className="px-10 py-4 bg-brand-red-600 text-white font-black text-xl rounded-xl hover:bg-brand-red-700 transition-colors">
                Apply Now
              </Link>
              <Link href="/supersonic-fast-cash/book-appointment" className="px-10 py-4 bg-white text-slate-900 font-black text-xl rounded-xl hover:bg-slate-100 transition-colors">
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DISCLOSURE */}
      <section className="py-6 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Electronic filing is subject to IRS validation. Acceptance is not guaranteed.
            Refund advance amounts and availability are subject to eligibility requirements
            and lender approval. All tax preparers are PTIN-credentialed and authorized for
            IRS e-file. Supersonic Fast Cash is a d/b/a of 2Exclusive LLC-S.
          </p>
        </div>
      </section>

    </div>
  );
}
