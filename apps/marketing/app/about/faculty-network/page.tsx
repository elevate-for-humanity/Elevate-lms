import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Faculty, Regional Coordinators & Training Partners | Elevate for Humanity',
  description: 'Explore Elevate for Humanity program leaders, regional coordination, supervised training partners, and the types of career education each supports.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/about/faculty-network' },
};

type Card = {
  name: string;
  role: string;
  area: string;
  offerings: string[];
  image: string;
  imageAlt: string;
  portrait?: boolean;
  href?: string;
};

const faculty: Card[] = [
  {
    name: 'Carlina A. Wilkes', role: 'Program holder & instructional lead',
    area: 'Beauty trades and business education',
    offerings: ['Cosmetology-related instruction', 'Business and entrepreneurship'],
    image: '/images/carlina-wilkes.jpg', imageAlt: 'Carlina A. Wilkes', portrait: true,
    href: '/about/team/carlina-wilkes',
  },
  {
    name: 'David Nazario', role: 'HVAC instructor',
    area: 'Skilled trades and certification preparation',
    offerings: ['HVAC fundamentals', 'EPA Section 608 examination preparation', 'Instructor-led and practical sessions'],
    image: '/images/hvac-training-vibrant-2026.webp',
    imageAlt: 'Illustrative HVAC training scene; not a portrait of David Nazario',
  },
  {
    name: 'Josanna George', role: 'Program holder and independent host-shop partner',
    area: 'Esthetics and nail technology',
    offerings: ['Esthetics supervision and coordination', 'Nail technology supervision and coordination', 'Supervised host-shop training'],
    image: '/images/jozanna-george.jpg', imageAlt: 'Josanna George', portrait: true,
    href: '/about/team/jozanna-george',
  },
];

const coordinators: Card[] = [
  {
    name: 'Tempestt Barnes', role: 'Gary-area site coordinator',
    area: 'Northwest Indiana — Gary-area outreach and coordination',
    offerings: ['Local partner communications', 'Site planning coordination', 'Community outreach'],
    image: '/images/about-training-20261102.webp',
    imageAlt: 'Illustrative adult learning scene; not a portrait of Tempestt Barnes',
  },
  {
    name: 'Matthew Barnes', role: 'Gary-area site coordinator',
    area: 'Northwest Indiana — Gary-area outreach and coordination',
    offerings: ['Local partner communications', 'Site planning coordination', 'Community outreach'],
    image: '/images/business-collaboration-vibrant-2026.webp',
    imageAlt: 'Illustrative team collaboration scene; not a portrait of Matthew Barnes',
  },
];

const hostShops: Card[] = [
  {
    name: 'Kountry Kutz Barbershop', role: 'Independent host-shop partner', area: 'Barbering',
    offerings: ['Supervised barber workplace experience'],
    image: '/images/partners/kountry-kutz-official.webp', imageAlt: 'Kountry Kutz host-shop promotional image',
  },
  {
    name: 'Cals Kutz Studio', role: 'Independent host-shop partner', area: 'Barbering',
    offerings: ['Supervised barber workplace experience'],
    image: '/images/partners/cals-kutz-official.webp', imageAlt: 'Cals Kutz promotional image',
  },
  {
    name: 'Salon Saloon LLC', role: 'Independent host-shop partner', area: 'Beauty trades',
    offerings: ['Supervised beauty-trade workplace experience'],
    image: '/images/partners/salon-saloon-official.webp', imageAlt: 'Salon Saloon promotional image',
  },
  {
    name: 'Mesmerized by Beauty', role: 'Independent host-shop partner', area: 'Esthetics and nails',
    offerings: ['Supervised esthetics workplace experience', 'Supervised nail technology workplace experience'],
    image: '/images/jozanna-george.jpg', imageAlt: 'Josanna George, associated with Mesmerized by Beauty', portrait: true,
  },
];

const additionalHosts = [
  'J Noelle & Co.', 'Styles & Scissors', 'Top Shelf Barber Lounge',
  'Studio Fresh LLC', 'DBO Hair Studios', 'Barbershop 32',
];

const categories = [
  { title: 'Barber & beauty apprenticeships', details: 'Related instruction and supervised learning at approved host sites; specific occupation, supervisor and location depend on each participant’s placement.', href: '/apprenticeships' },
  { title: 'HVAC & skilled trades', details: 'HVAC foundations, practical training and EPA Section 608 examination preparation; certification depends on the applicable examination.', href: '/programs' },
  { title: 'Business, tax & bookkeeping', details: 'Business development, entrepreneurship, bookkeeping and tax-preparation learning pathways. Program availability and credentials vary.', href: '/programs' },
  { title: 'Workforce and community services', details: 'Career preparation, employer engagement, and regional site coordination; prospective Gary-area facilities and offerings remain subject to applicable approvals.', href: '/community-services' },
];

function Cards({ items }: { items: Card[] }) {
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {items.map(item => <article key={item.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative aspect-[4/3] bg-slate-100">
        <Image src={item.image} alt={item.imageAlt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className={item.portrait ? 'object-cover object-top' : 'object-cover'} />
      </div>
      <div className="p-6">
        {!item.portrait && <p className="mb-2 text-xs font-medium text-slate-500">Program or partner illustration — not an individual headshot</p>}
        <h3 className="text-xl font-bold text-slate-950">{item.name}</h3>
        <p className="mt-1 font-semibold text-brand-red-700">{item.role}</p>
        <p className="mt-2 text-sm text-slate-700">{item.area}</p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
          {item.offerings.map(offering => <li key={offering}>{offering}</li>)}
        </ul>
        {item.href && <Link href={item.href} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-red-700 underline">View public profile</Link>}
      </div>
    </article>)}
  </div>;
}

export default function FacultyNetworkPage() {
  return <main className="min-h-screen bg-white text-slate-950">
    <div className="border-b border-slate-200"><div className="mx-auto max-w-6xl px-4 py-3">
      <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Faculty & partner network' }]} />
    </div></div>
    <header className="bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <Image src="/logo.svg" width={180} height={60} alt="Elevate for Humanity logo" className="mb-8 h-auto max-w-44 rounded bg-white p-2" />
        <p className="text-sm font-bold uppercase tracking-widest text-red-300">People · Programs · Partners</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight md:text-5xl">Faculty & regional training network</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">Meet our instructional program holders, local coordinators and independent hands-on training partners. Each group plays a different role in supporting career education.</p>
        <nav aria-label="Page sections" className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          {([['#faculty','Program holders'],['#regions','Regional coordinators'],['#hosts','Host shops'],['#offerings','Program categories'],['#accountability','Accountability']] as const).map(([href,label]) => <a key={href} href={href} className="rounded-lg border border-white/50 px-4 py-3 hover:bg-white/10">{label}</a>)}
        </nav>
      </div>
    </header>
    <section className="mx-auto max-w-6xl px-4 py-12" id="faculty">
      <h2 className="text-3xl font-bold">Instructional program holders</h2>
      <p className="mb-8 mt-3 max-w-3xl leading-7 text-slate-700">Program holders are shown alongside their instructional responsibilities. Published role descriptions are not substitutes for verifying an individual’s current professional license, qualification or program authorization.</p>
      <Cards items={faculty} />
    </section>
    <section className="bg-slate-50 px-4 py-12" id="regions">
      <div className="mx-auto max-w-6xl"><h2 className="text-3xl font-bold">Regional site coordination</h2>
        <p className="mb-8 mt-3 max-w-3xl leading-7 text-slate-700">Indianapolis is our established home base. Gary-area outreach and proposed locations are identified separately; a planned site is not represented as an approved classroom.</p>
        <Cards items={coordinators} />
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold">Indianapolis / Central Indiana</h3>
          <p className="mt-2 text-slate-700">Administrative and institutional coordination through Elevate for Humanity. For verified locations and visitor arrangements, use our official contact page.</p>
          <Link href="/contact" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-red-700 underline">Contact the Indianapolis team</Link>
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-4 py-12" id="hosts">
      <h2 className="text-3xl font-bold">Independent host shops & third-party training sites</h2>
      <p className="mb-8 mt-3 max-w-3xl leading-7 text-slate-700">Host shops are independent businesses offering or coordinating supervised practical experiences. Their inclusion does not imply they are Elevate employees or that every location currently has an available apprenticeship seat.</p>
      <Cards items={hostShops} />
      <div className="mt-8 rounded-xl bg-slate-50 p-6">
        <h3 className="text-xl font-bold">Additional host-shop network</h3>
        <ul className="mt-4 grid list-disc gap-2 pl-5 text-slate-700 sm:grid-cols-2">
          {additionalHosts.map(name => <li key={name}>{name}</li>)}
        </ul>
        <p className="mt-4 text-sm text-slate-600">Individual logos, location-specific offerings, public headshots, and availability are added only after confirming public-use permission and current host status.</p>
        <Link href="/partners/host-shops" className="mt-3 inline-flex min-h-11 items-center font-semibold text-brand-red-700 underline">Explore host-shop opportunities</Link>
      </div>
    </section>
    <section className="bg-slate-50 px-4 py-12" id="offerings"><div className="mx-auto max-w-6xl">
      <h2 className="text-3xl font-bold">Training offerings by category</h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">{categories.map(category => <article key={category.title} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-xl font-bold">{category.title}</h3><p className="mt-3 leading-7 text-slate-700">{category.details}</p>
        <Link href={category.href} className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-red-700 underline">Explore offerings</Link>
      </article>)}</div>
    </div></section>
    <section className="mx-auto max-w-6xl px-4 py-12" id="accountability">
      <h2 className="text-3xl font-bold">Credentials, outcomes & accountability</h2>
      <p className="mt-4 max-w-4xl leading-7 text-slate-700">Program-level approvals, instructor licensing, employer agreements, and participant outcomes must be assessed in their own categories. Credential preparation is not the same as award of a credential. Independent hosts retain their separate business identities.</p>
      <div className="mt-6 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5 text-slate-900">
        <h3 className="font-bold">Retention and student training totals</h3>
        <p className="mt-2 leading-7">An institutional retention percentage and total students trained will be published here once the reporting period, enrolled-student denominator, retention definition, and de-identified supporting records are verified. We do not present an unvalidated metric as independently audited.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-4"><Link href="/compliance/center" className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white">Approvals & accountability</Link><Link href="/partners" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-5 py-3 font-bold">Partnership information</Link></div>
    </section>
  </main>;
}
