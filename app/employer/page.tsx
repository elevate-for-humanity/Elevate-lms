import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Phone } from 'lucide-react';
import PageVideoHero from '@/components/ui/PageVideoHero';

export const metadata: Metadata = {
  title: 'Hire Trained Graduates | Employer Partnership | Elevate for Humanity',
  description: 'Hire pre-screened, credentialed graduates. Access WOTC tax credits, OJT wage reimbursement, and Registered Apprenticeship sponsorship.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer' },
};

const INCENTIVES = [
  { title: 'WOTC Tax Credit', desc: 'Up to $9,600 per qualifying hire through the Work Opportunity Tax Credit program.', img: '/images/pages/funding-impact-1.jpg', alt: 'WOTC tax credit for employers' },
  { title: 'OJT Wage Reimbursement', desc: 'Reimburse up to 50% of wages during on-the-job training through WIOA funding.', img: '/images/pages/funding-impact-2.jpg', alt: 'OJT wage reimbursement' },
  { title: 'Registered Apprenticeship', desc: 'Sponsor apprentices through our DOL-registered program. We handle compliance and reporting.', img: '/images/pages/apprenticeship-sponsor-page-1.jpg', alt: 'Registered apprenticeship sponsorship' },
  { title: 'Pre-Screened Candidates', desc: 'Graduates arrive credentialed, drug-tested, and work-ready. No cold recruiting.', img: '/images/pages/hire-graduates-page-1.jpg', alt: 'Pre-screened credentialed candidates' },
  { title: 'Credential Testing On-Site', desc: 'We proctor EPA 608, OSHA, WorkKeys, and more at our Indianapolis testing center.', img: '/images/pages/certifications-page-1.jpg', alt: 'On-site credential testing' },
  { title: 'Upskill Your Workforce', desc: 'WIOA-funded upskilling for current employees at no cost to eligible participants.', img: '/images/pages/training-page-1.jpg', alt: 'Workforce upskilling programs' },
];

const SECTORS = [
  { label: 'HVAC Technicians', credential: 'EPA 608 Universal', img: '/images/pages/hvac-technician.jpg' },
  { label: 'CNA / Healthcare', credential: 'Indiana State Board', img: '/images/pages/healthcare-sector.jpg' },
  { label: 'CDL Drivers', credential: 'Indiana BMV Class A', img: '/images/pages/cdl-training.jpg' },
  { label: 'IT Support', credential: 'CompTIA A+', img: '/images/pages/it-help-desk.jpg' },
  { label: 'Barbers', credential: 'Indiana IPLA License', img: '/images/pages/barber-hero-main.jpg' },
  { label: 'Welders', credential: 'NCCER Core', img: '/images/pages/welding.jpg' },
];

const STEPS = [
  { n: '1', title: 'Tell Us What You Need', desc: 'Share the roles, volume, and timeline. We match you to current and upcoming graduates.', img: '/images/pages/contact-page-1.jpg' },
  { n: '2', title: 'Review Candidates', desc: 'We send pre-screened profiles. You interview who you want — no placement fees.', img: '/images/pages/career-services-page-2.jpg' },
  { n: '3', title: 'Hire & Access Incentives', desc: 'We handle WOTC paperwork, OJT agreements, and apprenticeship compliance.', img: '/images/pages/employer-page-1.jpg' },
  { n: '4', title: 'Ongoing Support', desc: 'Upskill your team, sponsor apprentices, or run group credential testing at our center.', img: '/images/pages/training-page-2.jpg' },
];

export default function EmployerPage() {
  return (
    <div className="min-h-screen bg-white">

      <PageVideoHero
        videoSrc="/videos/employer-hero.mp4"
        posterSrc="/images/pages/employer-hero.jpg"
        audioSrc="/audio/heroes/career-services.mp3"
        posterAlt="Employer partnerships — hire trained graduates"
        size="marketing"
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">For Employers</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-3">Hire Credentialed Graduates</h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Elevate graduates arrive trained, tested, and credentialed. Access WOTC tax credits, OJT wage reimbursement, and Registered Apprenticeship sponsorship — all through one partner.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/testing/book?type=group-testing" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors">
              Partner With Us <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/employer/candidates" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold px-5 py-3 rounded-lg transition-colors text-sm">
              Browse Candidates
            </Link>
            <a href="tel:+13173143757" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </div>

      {/* Incentives grid */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">What You Get</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Employer Benefits</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {INCENTIVES.map(({ title, desc, img, alt }) => (
              <div key={title} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
                <div className="relative h-40 flex-shrink-0">
                  <Image src={img} alt={alt} fill sizes="400px" className="object-cover" />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available sectors */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Available Talent</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">Sectors We Train</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SECTORS.map(({ label, credential, img }) => (
              <div key={label} className="group rounded-xl overflow-hidden border border-slate-200">
                <div className="relative h-28">
                  <Image src={img} alt={label} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2 bg-white">
                  <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">{label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{credential}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-2">Process</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ n, title, desc, img }) => (
              <div key={n} className="flex flex-col">
                <div className="relative h-40 rounded-xl overflow-hidden mb-3 flex-shrink-0">
                  <Image src={img} alt={title} fill sizes="300px" className="object-cover" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white text-white font-extrabold text-sm flex items-center justify-center shadow">{n}</div>
                </div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">Ready to Hire?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">Start the Conversation</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Tell us what roles you need to fill. We'll match you to current graduates, walk you through available incentives, and set up a hiring pipeline that works for your team.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/testing/book?type=group-testing" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-sm">
                  Partner With Us <ChevronRight className="w-4 h-4" />
                </Link>
                <a href="mailto:info@elevateforhumanity.org" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-lg transition-colors text-sm">
                  Email Us
                </a>
              </div>
            </div>
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src="/images/pages/employers-page-1.jpg" alt="Employer partnership meeting" fill sizes="600px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
