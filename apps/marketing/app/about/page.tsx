import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PublicEditorialHero } from '@/components/marketing/PublicEditorialHero';
import { organization } from '@/lib/config/organization';
import { TEAM_PREVIEW } from '@/data/team';
import { teamProfileHref } from '@/lib/navigation/team-profile';

export const metadata: Metadata = {
  title: 'About Elevate for Humanity | Elizabeth Greene & Workforce Development',
  description:
    'Meet Elizabeth Greene, Founder and CEO of Elevate for Humanity, and learn how Elevate connects workforce training, registered apprenticeship, testing, funding navigation, employer partnerships, and technology in Indianapolis.',
  keywords: [
    'Elizabeth Greene Elevate for Humanity',
    'workforce development Indianapolis',
    'registered apprenticeship Indiana',
    'career training Indianapolis',
    'WIOA training provider Indiana',
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org/about' },
  openGraph: {
    type: 'profile',
    url: 'https://www.elevateforhumanity.org/about',
    title: 'Elizabeth Greene & Elevate for Humanity Workforce Development',
    description:
      'Meet Elizabeth Greene and explore Elevate for Humanity career training, registered apprenticeship, workforce funding navigation, testing, and employer partnerships in Indianapolis.',
    images: [
      {
        url: '/images/team/elizabeth-greene.webp',
        width: 1200,
        height: 1200,
        alt: 'Elizabeth Greene, Founder and CEO of Elevate for Humanity workforce development organization in Indianapolis',
      },
    ],
  },
};

const pathways = [
  { title: 'Career training', text: 'Build practical skills for your next career.', href: '/programs', image: '/images/programs/refresh-20261101/home.webp', alt: 'Illustrative career training scene' },
  { title: 'Apprenticeships', text: 'Connect related instruction with learning on the job.', href: '/apprenticeships', image: '/images/programs/refresh-20261101/beauty.webp', alt: 'Illustrative barber and beauty training scene' },
  { title: 'Employer partnerships', text: 'Help shape training and connect with emerging talent.', href: '/partners', image: '/images/programs/refresh-20261101/employers.webp', alt: 'Illustrative employer collaboration scene' },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-3"><Breadcrumbs items={[{ label: 'About Elevate' }]} /></div>
      <PublicEditorialHero
        eyebrow="About Elevate for Humanity"
        title="People. Skills. Opportunity."
        description="We connect career training, registered apprenticeships, and employer partnerships to help adults take their next step. Based in Indianapolis, we bring learning, support, and career preparation together."
        image="/images/about-training-20261102.webp"
        imageAlt="Illustrative scene of adult learners collaborating with an instructor in a bright career training center"
      >
        <Link href="#our-team" className="inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Meet our people</Link>
        <Link href="/programs" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100">Explore programs</Link>
      </PublicEditorialHero>
      <nav aria-label="About this organization" className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 py-2 text-sm font-semibold">
          {[['#mission','Our mission'],['#founder','Our founder'],['#our-team','Team & staff'],['#what-we-do','What we do'],['#accountability','Accountability']].map(([href,label]) => <Link key={href} href={href} className="inline-flex min-h-11 items-center text-slate-800 hover:text-brand-red-700 hover:underline">{label}</Link>)}
        </div>
      </nav>
      <section id="mission" className="mx-auto grid max-w-6xl scroll-mt-6 gap-6 px-4 py-12 md:grid-cols-2">
        <h2 className="text-3xl font-bold tracking-tight">A practical path forward.</h2>
        <div className="space-y-4 text-base leading-7 text-slate-700">
          <p>Our mission is to expand access to career education and meaningful work. We help learners understand their options, prepare for training, and connect classroom learning with real workplace expectations.</p>
          <p>Programs bring together technical instruction, credential preparation, apprenticeship opportunities, and participant support. Funding and eligibility vary by program; our team helps you understand the steps before you enroll.</p>
          <Link href="/funding" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700 hover:underline">Understand funding options <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <section id="founder" className="scroll-mt-6 bg-slate-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[0.7fr_1fr]">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl bg-white">
            <Image src={organization.founder.imagePath} alt="Elizabeth Greene, Founder and Chief Executive Officer" fill sizes="(min-width: 768px) 384px, 100vw" className="object-cover object-top" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">Founder &amp; Chief Executive Officer</p>
            <h2 className="mt-3 text-3xl font-bold">Elizabeth Greene</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">Elizabeth founded Elevate for Humanity to connect education, apprenticeship, and community support. She leads the organization’s career training, employer partnerships, and workforce platform operations.</p>
            <Link href="/about/elizabeth-greene" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Meet our founder <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
      <section id="our-team" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-3xl font-bold">The people behind your next step.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-700">Meet the leaders and staff who support our learners, programs, and community.</p></div>
          <Link href="/about/team" className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700 hover:underline">View the full team <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEAM_PREVIEW.map(member => <article key={member.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {member.headshotSrc && <div className="relative aspect-[4/5] bg-slate-50"><Image src={member.headshotSrc} alt={member.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover object-top" /></div>}
            <div className="p-5"><h3 className="text-lg font-bold">{member.name}</h3><p className="mt-2 text-sm leading-6 text-slate-700">{member.title}</p><Link href={teamProfileHref(member)} className="mt-3 inline-flex min-h-11 items-center font-bold text-brand-red-700 hover:underline">Meet {member.name.replace(/^Dr\. /, '').split(' ')[0]} →</Link></div>
          </article>)}
        </div>
      </section>
      <section id="what-we-do" className="scroll-mt-6 bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-6xl"><h2 className="mb-7 text-3xl font-bold">How we help.</h2>
          <div className="grid gap-6 md:grid-cols-3">{pathways.map(item => <article key={item.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative aspect-[3/2]"><Image src={item.image} alt={item.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" /></div>
            <div className="p-6"><h3 className="text-xl font-bold">{item.title}</h3><p className="mt-3 leading-7 text-slate-700">{item.text}</p><Link href={item.href} className="mt-3 inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700 hover:underline">Explore {item.title.toLowerCase()} <ArrowRight className="h-4 w-4" /></Link></div>
          </article>)}</div>
        </div>
      </section>
      <section id="accountability" className="mx-auto grid max-w-6xl scroll-mt-6 gap-8 px-4 py-12 md:grid-cols-2">
        <div><h2 className="text-3xl font-bold">Get to know Elevate.</h2><p className="mt-4 leading-7 text-slate-700">Review our organizational information, approvals, and program requirements. Our compliance center keeps these details together so you can make an informed choice.</p><Link href="/compliance/center" className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700 hover:underline">Approvals &amp; accountability <ArrowRight className="h-4 w-4" /></Link></div>
        <div className="rounded-2xl border border-slate-200 p-6"><h3 className="text-xl font-bold">Contact &amp; visit</h3><p className="mt-3 leading-7 text-slate-700">Speak with our team about programs, enrollment, or a partnership. Visits and hands-on training arrangements are confirmed with the team.</p><Link href="/contact" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-red-700 px-5 py-3 font-bold text-white hover:bg-brand-red-800">Contact Elevate</Link></div>
      </section>
    </main>
  );
}
