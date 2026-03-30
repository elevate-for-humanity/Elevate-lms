import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Career Training Programs | Elevate for Humanity',
  description:
    'Funded career training in healthcare, skilled trades, technology, CDL, and business. WIOA and grant funding available. Get trained, certified, and hired in weeks.',
  alternates: { canonical: '/programs' },
};

const FAST_TRACK = [
  { title: 'Phlebotomy Technician', desc: 'Start working in clinics and labs in as little as 4 weeks', duration: '4 weeks', funded: false, pay: '$16–$22/hr', slug: 'phlebotomy', image: '/images/pages/phlebotomy.jpg' },
  { title: 'Forklift Operator', desc: 'Get certified and job-ready for warehouse and logistics roles', duration: '1 week', funded: true, pay: '$15–$20/hr', slug: 'forklift', image: '/images/pages/forklift.jpg' },
  { title: 'CPR & First Aid', desc: 'Required certification for healthcare and safety roles', duration: '1 week', funded: true, pay: null, slug: 'cpr-first-aid', image: '/images/pages/cpr-mannequin.jpg' },
  { title: 'Sanitation & Infection Control', desc: 'Entry-level certification for healthcare and facilities work', duration: '2 weeks', funded: true, pay: null, slug: 'sanitation-infection-control', image: '/images/pages/sanitation.jpg' },
];

const HEALTHCARE = [
  { title: 'Certified Nursing Assistant (CNA)', desc: 'Work in hospitals, nursing homes, and long-term care', duration: '6 weeks', funded: false, pay: '$16–$22/hr', slug: 'cna', image: '/images/pages/cna-patient-care.jpg' },
  { title: 'Medical Assistant', desc: 'Work directly with physicians in clinics and healthcare offices', duration: '12 weeks', funded: true, pay: '$18–$25/hr', slug: 'medical-assistant', image: '/images/pages/medical-assistant-lab.jpg' },
  { title: 'Pharmacy Technician', desc: 'Prepare for PTCB certification and work in pharmacies', duration: '10 weeks', funded: true, pay: '$18–$24/hr', slug: 'pharmacy-technician', image: '/images/pages/pharmacy-tech.jpg' },
  { title: 'Peer Recovery Specialist', desc: 'Support individuals in recovery and behavioral health programs', duration: '4 weeks', funded: true, pay: null, slug: 'peer-recovery-specialist', image: '/images/pages/peer-recovery.jpg' },
];

const TRADES = [
  { title: 'HVAC Technician', desc: 'Install and maintain heating and cooling systems → EPA 608', duration: '12 weeks', funded: true, pay: '$20–$30/hr', slug: 'hvac-technician', image: '/images/pages/hvac-unit.jpg' },
  { title: 'Electrical Technician', desc: 'Entry pathway into residential and commercial electrical work', duration: '12 weeks', funded: true, pay: null, slug: 'electrical', image: '/images/pages/electrical-wiring.jpg' },
  { title: 'Welding Technology', desc: 'Fabrication and welding for industrial careers', duration: '10 weeks', funded: true, pay: null, slug: 'welding', image: '/images/pages/welding-sparks.jpg' },
  { title: 'Plumbing Technician', desc: 'Residential and commercial plumbing systems training', duration: '10 weeks', funded: true, pay: null, slug: 'plumbing', image: '/images/pages/plumbing-pipes.jpg' },
  { title: 'Construction Trades', desc: 'Multi-skill entry into construction careers', duration: '8 weeks', funded: true, pay: null, slug: 'construction-trades-certification', image: '/images/pages/construction-trades.jpg' },
  { title: 'Diesel Mechanic', desc: 'Service and repair heavy-duty engines and equipment', duration: '12 weeks', funded: true, pay: null, slug: 'diesel-mechanic', image: '/images/pages/diesel-mechanic.jpg' },
  { title: 'CDL Class A Training', desc: 'Become a licensed commercial driver', duration: '6 weeks', funded: true, pay: '$22–$35/hr', slug: 'cdl-training', image: '/images/pages/cdl-truck-highway.jpg' },
];

const TECHNOLOGY = [
  { title: 'IT Help Desk Technician', desc: 'Entry-level IT support → CompTIA A+', duration: '8 weeks', funded: true, pay: '$18–$26/hr', slug: 'it-help-desk', image: '/images/pages/it-helpdesk-desk.jpg' },
  { title: 'Cybersecurity Analyst', desc: 'Protect systems and networks → CompTIA Security+', duration: '12 weeks', funded: true, pay: '$25–$40/hr', slug: 'cybersecurity-analyst', image: '/images/pages/cybersecurity-screen.jpg' },
  { title: 'Network Support Technician', desc: 'Install and maintain network systems', duration: '6 weeks', funded: true, pay: null, slug: 'network-support-technician', image: '/images/pages/networking-hero.jpg' },
  { title: 'Web Development', desc: 'Build websites and digital applications', duration: '12 weeks', funded: true, pay: null, slug: 'web-development', image: '/images/pages/web-development.jpg' },
  { title: 'Software Development', desc: 'Learn coding fundamentals and programming logic', duration: '12 weeks', funded: true, pay: null, slug: 'software-development', image: '/images/pages/software-development.jpg' },
  { title: 'Graphic Design', desc: 'Digital design for business, branding, and media', duration: '10 weeks', funded: true, pay: null, slug: 'graphic-design', image: '/images/pages/tech-classroom.jpg' },
  { title: 'CAD/Drafting Technician', desc: 'Design technical drawings for engineering and construction', duration: '10 weeks', funded: true, pay: null, slug: 'cad-drafting', image: '/images/pages/tech-classroom.jpg' },
];

const BUSINESS = [
  { title: 'Bookkeeping & QuickBooks', desc: 'Manage financial records for businesses', duration: '5 weeks', funded: true, pay: null, slug: 'bookkeeping', image: '/images/pages/bookkeeping-ledger.jpg' },
  { title: 'Office Administration', desc: 'Administrative and operational support roles', duration: '6 weeks', funded: true, pay: null, slug: 'office-administration', image: '/images/pages/office-admin-desk.jpg' },
  { title: 'Tax Preparation', desc: 'Seasonal and year-round tax services careers', duration: '8 weeks', funded: true, pay: null, slug: 'tax-preparation', image: '/images/pages/tax-prep-desk.jpg' },
  { title: 'Business Administration', desc: 'Foundations in operations and management', duration: '8 weeks', funded: true, pay: null, slug: 'business', image: '/images/pages/business-sector.jpg' },
  { title: 'Entrepreneurship & Small Business', desc: 'Start and grow your own business', duration: '6 weeks', funded: true, pay: null, slug: 'entrepreneurship', image: '/images/pages/entrepreneurship.jpg' },
  { title: 'Project Management', desc: 'Plan and lead business and technical projects', duration: '6 weeks', funded: true, pay: null, slug: 'project-management', image: '/images/pages/project-management.jpg' },
];

const APPRENTICESHIPS = [
  { title: 'Barber Apprenticeship', duration: '52 weeks', pay: '$28–$52k/yr', slug: 'barber-apprenticeship', image: '/images/pages/barber-hero-main.jpg' },
  { title: 'Cosmetology Apprenticeship', duration: '52 weeks', pay: null, slug: 'cosmetology-apprenticeship', image: '/images/pages/cosmetology.jpg' },
  { title: 'Nail Technician Apprenticeship', duration: '20 weeks', pay: null, slug: 'nail-technician-apprenticeship', image: '/images/pages/nail-technician.jpg' },
  { title: 'Culinary Apprenticeship', duration: '26 weeks', pay: null, slug: 'culinary-apprenticeship', image: '/images/pages/culinary.jpg' },
];

const SECTIONS = [
  {
    id: 'fast-track',
    label: 'High-Speed',
    title: 'Get a Job Fast',
    subtitle: '1–4 weeks to certification. Entry-level roles with immediate hiring demand.',
    sectionImage: '/images/pages/about-career-training.jpg',
    imageAlt: 'Career training students',
    imageLeft: false,
    programs: FAST_TRACK,
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    title: 'Healthcare Career Pathways',
    subtitle: 'Train for in-demand clinical and patient care roles. Hands-on practice included.',
    sectionImage: '/hero-images/healthcare-cat-new.jpg',
    imageAlt: 'Healthcare training',
    imageLeft: true,
    programs: HEALTHCARE,
  },
  {
    id: 'trades',
    label: 'Skilled Trades',
    title: 'Hands-On Trade Careers',
    subtitle: 'HVAC, CDL, welding, electrical, plumbing. Real tools, real skills, real wages.',
    sectionImage: '/hero-images/skilled-trades-cat-new.jpg',
    imageAlt: 'Skilled trades training',
    imageLeft: false,
    programs: TRADES,
  },
  {
    id: 'technology',
    label: 'Technology',
    title: 'Tech & IT Careers',
    subtitle: 'CompTIA certifications, cybersecurity, development. Remote-friendly careers.',
    sectionImage: '/hero-images/technology-cat-new.jpg',
    imageAlt: 'Technology training',
    imageLeft: true,
    programs: TECHNOLOGY,
  },
  {
    id: 'business',
    label: 'Business',
    title: 'Business & Office Careers',
    subtitle: 'Bookkeeping, administration, tax prep, entrepreneurship. Professional pathways.',
    sectionImage: '/hero-images/business-category.jpg',
    imageAlt: 'Business training',
    imageLeft: false,
    programs: BUSINESS,
  },
];

type Program = { title: string; desc: string; duration: string; funded: boolean; pay: string | null; slug: string; image: string };

function ProgramRow({ p }: { p: Program }) {
  return (
    <Link
      href={`/programs/${p.slug}`}
      className="group flex items-center gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 -mx-3 px-3 rounded-lg transition-colors"
    >
      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
        <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="56px" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 text-sm leading-snug">{p.title}</p>
          {p.funded && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Funded</span>}
        </div>
        <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{p.desc}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <div className="flex items-center gap-1 text-xs text-slate-400 justify-end mb-0.5">
          <Clock className="w-3 h-3" />{p.duration}
        </div>
        {p.pay && (
          <div className="flex items-center gap-0.5 text-xs font-bold text-green-700 justify-end">
            <DollarSign className="w-3 h-3" />{p.pay}
          </div>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-red-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero — static image, no video/avatar */}
      <section className="relative h-[60vh] min-h-[420px] max-h-[600px] overflow-hidden">
        <Image
          src="/images/pages/about-career-pathways.jpg"
          alt="Career training at Elevate for Humanity"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6 w-full">
            <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-3">Career Training Programs</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4 max-w-xl">
              Start a Career —<br />Not Just a Class
            </h1>
            <p className="text-slate-200 text-lg max-w-lg mb-8 leading-relaxed">
              Short-term training. Real credentials. Most programs available at no cost to eligible Indiana residents.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/apply/student" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm">
                Apply Now
              </Link>
              <a href="#programs" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm">
                Browse Programs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-slate-900 py-4 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {['WIOA & state funding available', 'DOL Registered Apprenticeship Sponsor', 'ETPL approved provider', 'Job placement assistance'].map((t) => (
            <span key={t} className="text-slate-300 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-red-500 rounded-full" />{t}
            </span>
          ))}
        </div>
      </section>

      {/* Sticky quick-nav */}
      <section className="bg-slate-50 border-b border-slate-200 py-4 px-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-2">
          {[
            { label: 'Fast Track', href: '#fast-track' },
            { label: 'Healthcare', href: '#healthcare' },
            { label: 'Skilled Trades', href: '#trades' },
            { label: 'Technology', href: '#technology' },
            { label: 'Business', href: '#business' },
            { label: 'Apprenticeships', href: '#apprenticeships' },
          ].map((g) => (
            <a key={g.label} href={g.href} className="bg-white hover:bg-brand-red-600 hover:text-white border border-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-full transition-all">
              {g.label}
            </a>
          ))}
        </div>
      </section>

      {/* Program sections */}
      <div id="programs" className="divide-y divide-slate-100">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="max-w-6xl mx-auto px-4 py-16">
            <div className={`flex flex-col ${section.imageLeft ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-10 items-start`}>

              {/* Section image */}
              <div className="w-full lg:w-2/5 flex-shrink-0">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={section.sectionImage}
                    alt={section.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {section.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Program list */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{section.title}</h2>
                <p className="text-slate-500 text-sm mb-6">{section.subtitle}</p>
                <div>
                  {section.programs.map((p) => <ProgramRow key={p.slug} p={p} />)}
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Apprenticeships */}
        <section id="apprenticeships" className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="w-full lg:w-2/5 flex-shrink-0">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/hero-images/barber-beauty-cat-new.jpg"
                  alt="Barber apprenticeship training"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Earn While You Learn
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Apprenticeships</h2>
              <p className="text-slate-500 text-sm mb-6">
                DOL Registered Apprenticeships — work in a licensed shop and earn wages from day one while completing your training hours.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {APPRENTICESHIPS.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/programs/${a.slug}`}
                    className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden">
                      <Image
                        src={a.image}
                        alt={a.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-sm leading-tight">{a.title}</p>
                        <p className="text-slate-300 text-xs mt-0.5">{a.duration} · Paid OJT</p>
                        {a.pay && <p className="text-green-300 text-xs font-semibold mt-0.5">{a.pay}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <p className="text-slate-400 text-xs mt-4">All apprenticeships are registered with the U.S. Department of Labor. Participants earn wages during training.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-slate-900 py-20 px-4 text-center">
        <div className="absolute inset-0 opacity-20">
          <Image src="/images/pages/workforce-training.jpg" alt="" fill className="object-cover" sizes="100vw" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white mb-3">Your Career Starts Here</h2>
          <p className="text-slate-300 text-base mb-8 leading-relaxed">
            Short-term training. Real credentials. Job placement support.<br />
            Most programs are available at no cost to eligible Indiana residents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base w-full sm:w-auto">
              Apply Now
            </Link>
            <Link href="/contact" className="border-2 border-slate-600 hover:border-slate-400 text-white font-bold px-10 py-4 rounded-xl transition-colors text-base w-full sm:w-auto">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
