export const dynamic = 'force-static';
export const revalidate = 86400;
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, DollarSign, Zap } from 'lucide-react';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

export const metadata: Metadata = {
  title: 'Career Training Programs | Elevate for Humanity',
  description:
    'Funded career training in healthcare, skilled trades, technology, CDL, and business. WIOA and grant funding available. Get trained, certified, and hired in weeks.',
  alternates: { canonical: '/programs' },
};

// ── Program data ──────────────────────────────────────────────────────────────

const FAST_TRACK = [
  { title: 'Phlebotomy Technician', desc: 'Start working in clinics and labs in as little as 4 weeks', duration: '4 weeks', format: 'Hybrid', funded: false, pay: '$16–$22/hr', slug: 'phlebotomy', image: '/images/pages/phlebotomy.jpg' },
  { title: 'Forklift Operator', desc: 'Get certified and job-ready for warehouse and logistics roles', duration: '1 week', format: 'Hybrid', funded: true, pay: '$15–$20/hr', slug: 'forklift', image: '/images/pages/forklift.jpg' },
  { title: 'CPR & First Aid', desc: 'Required certification for healthcare and safety roles', duration: '1 week', format: 'Online', funded: true, pay: null, slug: 'cpr-first-aid', image: '/images/pages/cpr-mannequin.jpg' },
  { title: 'Sanitation & Infection Control', desc: 'Entry-level certification for healthcare and facilities work', duration: '2 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'sanitation-infection-control', image: '/images/pages/sanitation.jpg' },
];

const HEALTHCARE = [
  { title: 'Certified Nursing Assistant (CNA)', desc: 'Work in hospitals, nursing homes, and long-term care', duration: '6 weeks', format: 'Hybrid', funded: false, pay: '$16–$22/hr', slug: 'cna', image: '/images/pages/cna-patient-care.jpg' },
  { title: 'Medical Assistant', desc: 'Work directly with physicians in clinics and healthcare offices', duration: '12 weeks', format: 'Hybrid', funded: true, pay: '$18–$25/hr', slug: 'medical-assistant', image: '/images/pages/medical-assistant-lab.jpg' },
  { title: 'Pharmacy Technician', desc: 'Prepare for PTCB certification and work in pharmacies', duration: '10 weeks', format: 'Hybrid', funded: true, pay: '$18–$24/hr', slug: 'pharmacy-technician', image: '/images/pages/pharmacy-tech.jpg' },
  { title: 'Peer Recovery Specialist', desc: 'Support individuals in recovery and behavioral health programs', duration: '4 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'peer-recovery-specialist', image: '/images/pages/peer-recovery.jpg' },
];

const TRADES = [
  { title: 'HVAC Technician', desc: 'Install and maintain heating and cooling systems → EPA 608', duration: '12 weeks', format: 'Hybrid', funded: true, pay: '$20–$30/hr', slug: 'hvac-technician', image: '/images/pages/hvac-unit.jpg' },
  { title: 'Electrical Technician', desc: 'Entry pathway into residential and commercial electrical work', duration: '12 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'electrical', image: '/images/pages/electrical-wiring.jpg' },
  { title: 'Welding Technology', desc: 'Fabrication and welding for industrial careers', duration: '10 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'welding', image: '/images/pages/welding-sparks.jpg' },
  { title: 'Plumbing Technician', desc: 'Residential and commercial plumbing systems training', duration: '10 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'plumbing', image: '/images/pages/plumbing-pipes.jpg' },
  { title: 'Construction Trades', desc: 'Multi-skill entry into construction careers', duration: '8 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'construction-trades-certification', image: '/images/pages/construction-trades.jpg' },
  { title: 'Diesel Mechanic', desc: 'Service and repair heavy-duty engines and equipment', duration: '12 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'diesel-mechanic', image: '/images/pages/diesel-mechanic.jpg' },
  { title: 'CDL Class A Training', desc: 'Become a licensed commercial driver', duration: '6 weeks', format: 'Hybrid', funded: true, pay: '$22–$35/hr', slug: 'cdl-training', image: '/images/pages/cdl-truck-highway.jpg' },
];

const TECHNOLOGY = [
  { title: 'IT Help Desk Technician', desc: 'Entry-level IT support → CompTIA A+', duration: '8 weeks', format: 'Hybrid', funded: true, pay: '$18–$26/hr', slug: 'it-help-desk', image: '/images/pages/it-helpdesk-desk.jpg' },
  { title: 'Cybersecurity Analyst', desc: 'Protect systems and networks → CompTIA Security+', duration: '12 weeks', format: 'Hybrid', funded: true, pay: '$25–$40/hr', slug: 'cybersecurity-analyst', image: '/images/pages/cybersecurity-screen.jpg' },
  { title: 'Network Support Technician', desc: 'Install and maintain network systems', duration: '6 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'network-support-technician', image: '/images/pages/networking-hero.jpg' },
  { title: 'Web Development', desc: 'Build websites and digital applications', duration: '12 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'web-development', image: '/images/pages/web-development.jpg' },
  { title: 'Software Development', desc: 'Learn coding fundamentals and programming logic', duration: '12 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'software-development', image: '/images/pages/software-development.jpg' },
  { title: 'Graphic Design', desc: 'Digital design for business, branding, and media', duration: '10 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'graphic-design', image: '/images/pages/tech-classroom.jpg' },
  { title: 'CAD/Drafting Technician', desc: 'Design technical drawings for engineering and construction', duration: '10 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'cad-drafting', image: '/images/pages/tech-classroom.jpg' },
];

const BUSINESS = [
  { title: 'Bookkeeping & QuickBooks', desc: 'Manage financial records for businesses', duration: '5 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'bookkeeping', image: '/images/pages/bookkeeping-ledger.jpg' },
  { title: 'Office Administration', desc: 'Administrative and operational support roles', duration: '6 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'office-administration', image: '/images/pages/office-admin-desk.jpg' },
  { title: 'Tax Preparation', desc: 'Seasonal and year-round tax services careers', duration: '8 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'tax-preparation', image: '/images/pages/tax-prep-desk.jpg' },
  { title: 'Business Administration', desc: 'Foundations in operations and management', duration: '8 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'business', image: '/images/pages/business-sector.jpg' },
  { title: 'Entrepreneurship & Small Business', desc: 'Start and grow your own business', duration: '6 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'entrepreneurship', image: '/images/pages/entrepreneurship.jpg' },
  { title: 'Project Management', desc: 'Plan and lead business and technical projects', duration: '6 weeks', format: 'Hybrid', funded: true, pay: null, slug: 'project-management', image: '/images/pages/project-management.jpg' },
];

const APPRENTICESHIPS = [
  { title: 'Barber Apprenticeship', duration: '52 weeks', slug: 'barber-apprenticeship', image: '/images/pages/barber-hero-main.jpg' },
  { title: 'Cosmetology Apprenticeship', duration: '52 weeks', slug: 'cosmetology-apprenticeship', image: '/images/pages/cosmetology.jpg' },
  { title: 'Nail Technician Apprenticeship', duration: '20 weeks', slug: 'nail-technician-apprenticeship', image: '/images/pages/nail-technician.jpg' },
  { title: 'Culinary Apprenticeship', duration: '26 weeks', slug: 'culinary-apprenticeship', image: '/images/pages/culinary.jpg' },
];

const CERTS = ['EPA Section 608', 'CompTIA A+', 'CompTIA Security+', 'PTCB CPhT', 'Microsoft Office Specialist', 'OSHA 30'];

// ── Sub-components ────────────────────────────────────────────────────────────

type Program = { title: string; desc: string; duration: string; format: string; funded: boolean; pay: string | null; slug: string; image: string };

function ProgramCard({ p }: { p: Program }) {
  return (
    <Link href={`/programs/${p.slug}`} className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-sm leading-tight">{p.title}</p>
        </div>
        {p.funded && (
          <span className="absolute top-3 right-3 bg-brand-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Funded</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-slate-500 text-xs mb-2 line-clamp-2">{p.desc}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="w-3 h-3" />{p.duration}</span>
          {p.pay && <span className="flex items-center gap-1 text-xs font-semibold text-brand-green-700"><DollarSign className="w-3 h-3" />{p.pay}</span>}
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-1">{label}</p>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgramsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden">
        <ProgramHeroBanner
          videoSrc="/videos/program-hero.mp4"
          posterImage="/images/pages/programs-hero.jpg"
          voiceoverSrc="/audio/heroes/programs.mp3"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 max-w-3xl">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            Start a Career —<br className="hidden sm:block" /> Not Just a Class
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-6">
            Get trained, certified, and connected to real job opportunities in weeks — not years.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm">
              Apply Now
            </Link>
            <Link href="#programs" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-7 py-3 rounded-lg transition-colors text-sm backdrop-blur-sm">
              Find My Program
            </Link>
          </div>
        </div>
      </section>

      {/* Decision engine */}
      <section className="bg-slate-900 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 text-center">Not sure where to start? Choose your goal</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Get a Job Fast', sub: '4–8 weeks', href: '#fast-track' },
              { label: 'Healthcare Career', sub: 'CNA, MA, Phlebotomy', href: '#healthcare' },
              { label: 'Skilled Trade', sub: 'HVAC, CDL, Welding', href: '#trades' },
              { label: 'Tech / IT', sub: 'CompTIA, Cyber, Dev', href: '#technology' },
              { label: 'Earn While You Learn', sub: 'Apprenticeships', href: '#apprenticeships' },
            ].map((g) => (
              <a key={g.label} href={g.href} className="group bg-white/5 hover:bg-brand-red-600 border border-white/10 rounded-xl p-4 text-center transition-all">
                <p className="text-white font-bold text-sm leading-tight mb-1">{g.label}</p>
                <p className="text-slate-400 group-hover:text-white/80 text-xs transition-colors">{g.sub}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Credentials strip */}
      <section className="bg-slate-50 border-b border-slate-200 py-5 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">Credentials you earn:</span>
          {CERTS.map((c) => (
            <span key={c} className="bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full">{c}</span>
          ))}
        </div>
      </section>

      {/* Program sections */}
      <div id="programs" className="max-w-6xl mx-auto px-4 py-14 space-y-16">

        {/* Fast track */}
        <section id="fast-track">
          <SectionHeader label="High-Speed" title="Get a Job Fast — 4–8 Weeks" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FAST_TRACK.map((p) => <ProgramCard key={p.slug} p={p} />)}
          </div>
        </section>

        {/* Healthcare */}
        <section id="healthcare">
          <SectionHeader label="Healthcare" title="Healthcare Career Pathways" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HEALTHCARE.map((p) => <ProgramCard key={p.slug} p={p} />)}
          </div>
        </section>

        {/* Trades */}
        <section id="trades">
          <SectionHeader label="Skilled Trades" title="Hands-On Trade Careers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRADES.map((p) => <ProgramCard key={p.slug} p={p} />)}
          </div>
        </section>

        {/* Technology */}
        <section id="technology">
          <SectionHeader label="Technology" title="Tech & IT Careers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TECHNOLOGY.map((p) => <ProgramCard key={p.slug} p={p} />)}
          </div>
        </section>

        {/* Business */}
        <section id="business">
          <SectionHeader label="Business" title="Business & Office Careers" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BUSINESS.map((p) => <ProgramCard key={p.slug} p={p} />)}
          </div>
        </section>

        {/* Apprenticeships */}
        <section id="apprenticeships">
          <SectionHeader label="Earn While You Learn" title="Apprenticeships" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {APPRENTICESHIPS.map((a) => (
              <Link key={a.slug} href={`/programs/${a.slug}`} className="group block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={a.image} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm leading-tight">{a.title}</p>
                    <p className="text-white/70 text-xs mt-0.5">{a.duration} · In Person · Funded</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-4">All apprenticeships are registered with the U.S. Department of Labor. Participants earn wages during training.</p>
        </section>

      </div>

      {/* Final CTA */}
      <section className="bg-slate-900 py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Zap className="w-8 h-8 text-brand-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-white mb-3">Your Career Starts Here</h2>
          <p className="text-slate-400 mb-8">Stop waiting. Start training for a career that pays.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/start" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-10 py-4 rounded-lg transition-colors text-base w-full sm:w-auto">
              Apply Now
            </Link>
            <Link href="/contact" className="border border-slate-600 hover:border-slate-400 text-white font-bold px-10 py-4 rounded-lg transition-colors text-base w-full sm:w-auto">
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
