import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users,
  Award,
  DollarSign,
  Clock,
  ArrowRight,
  Building2,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';
import EmployerPartners from '@/components/EmployerPartners';
import OJTSection from '@/components/employers/OJTSection';
import WOTCSection from '@/components/employers/WOTCSection';
import GrantsSection from '@/components/employers/GrantsSection';
import PageVideoHero from '@/components/ui/PageVideoHero';

export const metadata: Metadata = {
  title: 'For Employers — OJT Funding, Tax Credits & Trained Talent | Elevate for Humanity',
  description:
    'Hire trained candidates, get OJT wage reimbursement up to 75%, claim WOTC tax credits up to $9,600 per hire, and access workforce grants. No recruiting fees.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/employers',
  },
  openGraph: {
    title: 'For Employers | Elevate for Humanity',
    description: 'OJT wage reimbursement, WOTC tax credits, and pre-trained talent at no recruiting cost.',
    url: 'https://www.elevateforhumanity.org/employers',
    siteName: 'Elevate for Humanity',
    images: [{ url: '/images/pages/for-employers-page-1.jpg', width: 1200, height: 630, alt: 'Employer partnerships' }],
    type: 'website',
  },
};

export default function EmployersPage() {
  return (
    <div className="min-h-screen bg-white">

      <PageVideoHero
        videoSrc="/videos/employer-hero.mp4"
        posterSrc="/images/pages/employers-page-1.jpg"
        posterAlt="Employers — Elevate for Humanity"
        size="marketing"
      />
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'For Employers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[320px] md:min-h-[400px] flex items-center overflow-hidden">
        <Image
          src="/images/pages/employers-page-1.jpg"
          alt="Employer workforce partnership"
          fill
          className="object-cover"
          priority
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12 text-white">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 max-w-3xl leading-tight">
            The Government Will Pay You to Train Your Next Hire
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl mb-3">
            On-the-Job Training (OJT) reimburses employers up to 75% of a new hire&apos;s wages
            during their training period. The Work Opportunity Tax Credit (WOTC) gives you up to
            $9,600 in federal tax credits per qualifying hire. Both programs can be used on the
            same employee.
          </p>
          <p className="text-slate-400 mb-6 max-w-2xl">
            Elevate for Humanity provides pre-trained, certified candidates and handles all the
            workforce funding paperwork. You interview, you hire, you get reimbursed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact?type=employer"
              className="px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold rounded-lg transition"
            >
              Talk to Our Employer Team
            </Link>
            <a
              href="#ojt"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg border border-white/20 transition"
            >
              How OJT Works
            </a>
            <a
              href="#wotc"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg border border-white/20 transition"
            >
              WOTC Tax Credits
            </a>
          </div>
        </div>
      </section>

      {/* Value Props — Top Line */}
      <section className="py-6 bg-white text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-brand-orange-400">75%</div>
              <div className="text-xs text-slate-400 mt-1">OJT Wage Reimbursement</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-brand-orange-400">$9,600</div>
              <div className="text-xs text-slate-400 mt-1">Max WOTC Tax Credit / Hire</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-brand-orange-400">$0</div>
              <div className="text-xs text-slate-400 mt-1">Recruiting Fees</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-brand-orange-400">28 Days</div>
              <div className="text-xs text-slate-400 mt-1">WOTC Filing Deadline (We Help)</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              You Already Spend Money Training New Hires. Why Not Get Reimbursed?
            </h2>
            <div className="text-slate-600 space-y-4">
              <p>
                Every time you hire someone, you invest weeks or months getting them up to speed.
                You pay their wages while they learn. You assign senior staff to supervise them.
                You absorb the productivity gap. That is a real cost — and for most employers,
                it comes straight out of the bottom line.
              </p>
              <p>
                What most employers do not know is that the federal government has programs
                specifically designed to offset this cost. Not loans. Not grants you have to
                apply for months in advance. Programs that reimburse you <em>after</em> you hire
                someone, based on the wages you already paid.
              </p>
              <p>
                The two biggest programs are <strong>On-the-Job Training (OJT)</strong> and the
                <strong> Work Opportunity Tax Credit (WOTC)</strong>. Together, they can save you
                $10,000 to $25,000 per hire depending on the role and the candidate&apos;s background.
              </p>
              <p>
                The catch? Most employers never use them because the paperwork is confusing and
                the deadlines are tight. That is where Elevate comes in. We provide the candidates,
                set up the contracts, track the training, and make sure you get paid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* OJT Deep Dive */}
      <OJTSection />

      {/* WOTC Deep Dive */}
      <WOTCSection />

      {/* Additional Grants */}
      <GrantsSection />

      {/* Why Partner — Talent Pipeline */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
            What You Get When You Partner With Elevate
          </h2>
          <p className="text-center text-slate-600 mb-10 max-w-2xl mx-auto">
            We are not a staffing agency. We are a workforce training organization that produces
            job-ready candidates and connects them to employers who want to hire.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                image: '/images/pages/employers-page-1.jpg',
                alt: 'Pre-trained and pre-screened workforce candidates',
                title: 'Pre-Trained, Pre-Screened Candidates',
                desc: 'Every candidate we refer has completed a training program, earned at least one industry credential, and been assessed for job readiness. You are not getting random resumes — you are getting people who have already invested in their career.',
              },
              {
                image: '/images/pages/credentials-page-1.jpg',
                alt: 'Industry certifications earned before day one',
                title: 'Industry Certifications Already Earned',
                desc: 'Our graduates hold credentials recognized by employers and regulators: EPA 608, OSHA 10/30, CNA, CDL Class A/B, Indiana Barber License, CompTIA A+, QuickBooks, and more. They show up with proof of competency.',
              },
              {
                image: '/images/pages/admin-funding-hero.jpg',
                alt: 'Zero cost employer recruitment through workforce grants',
                title: 'Zero Recruiting Cost',
                desc: 'We do not charge employers for candidate referrals, job postings, or placement. Our funding comes from workforce grants, not employer fees. You pay nothing to access our talent pipeline.',
              },
              {
                image: '/images/pages/employers-page-2.jpg',
                alt: 'Faster ramp-up and lower turnover with trained graduates',
                title: 'Faster Ramp-Up, Lower Turnover',
                desc: 'Candidates who complete structured training programs are more likely to stay. They chose this career path deliberately, invested time in preparation, and have support services (career coaching, case management) that continue after placement.',
              },
              {
                image: '/images/pages/about-career-training.jpg',
                alt: 'Ongoing post-placement support for employers and employees',
                title: 'Ongoing Support After Placement',
                desc: 'We do not disappear after the hire. Elevate provides post-placement follow-up for both the employer and the employee. If issues arise during the OJT period, we help resolve them before they become terminations.',
              },
              {
                image: '/images/pages/employers-page-3.jpg',
                alt: 'Workforce funding coordination including OJT and WOTC',
                title: 'Workforce Funding Coordination',
                desc: 'OJT contracts, WOTC pre-screening, Federal Bonding applications, apprenticeship registration — we handle the administrative burden so you can focus on running your business.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                  <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host an Apprentice */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-10 items-start">
              <div>
                <Building2 className="w-10 h-10 text-brand-orange-400 mb-4" />
                <h2 className="text-3xl font-bold mb-4">Host an Apprentice at Your Business</h2>
                <p className="text-slate-300 mb-4">
                  Registered Apprenticeship is the gold standard of workforce training. It combines
                  structured on-the-job learning with classroom instruction, and it produces employees
                  who are trained to <em>your</em> standards — not a generic curriculum.
                </p>
                <p className="text-slate-300 mb-6">
                  As a DOL Registered Apprenticeship Sponsor, Elevate handles everything except the
                  hands-on training itself. We provide the online curriculum (Related Technical
                  Instruction), track competencies, manage RAPIDS reporting, and coordinate funding.
                  You provide the worksite, the supervision, and the real-world experience.
                </p>
                <ul className="space-y-3 mb-8 text-sm">
                  {[
                    'Train talent to your exact business standards — not a textbook version',
                    'Apprentices are your employees from day one, building loyalty and institutional knowledge',
                    'OJT wage reimbursement applies during the apprenticeship training period',
                    'No curriculum development required — Elevate provides all RTI through the LMS',
                    'Elevate manages RAPIDS reporting, competency tracking, and DOL compliance',
                    'Apprenticeship completion rates are higher than traditional hiring — people who commit to 2,000 hours tend to stay',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-brand-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-200">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/partners/join"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-orange-500 hover:bg-brand-orange-600 text-white font-bold rounded-lg transition"
                >
                  Become a Training Partner <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div>
                <div className="bg-white/10 rounded-xl p-6 space-y-4 mb-6">
                  <h3 className="font-semibold text-white mb-3">Available Apprenticeship Programs</h3>
                  {[
                    { program: 'Barber Apprenticeship', hours: '2,000 OJT hours', credential: 'Indiana Barber License (PLA)', duration: '12 months' },
                    { program: 'Cosmetology Apprenticeship', hours: '1,500 OJT hours', credential: 'Indiana Cosmetology License', duration: '10 months' },
                    { program: 'HVAC Technician', hours: '2,000 OJT hours', credential: 'EPA 608 + OSHA 10', duration: '12 months' },
                    { program: 'Electrical Apprenticeship', hours: '2,000 OJT hours', credential: 'NCCER Level 1', duration: '12 months' },
                    { program: 'Welding', hours: '2,000 OJT hours', credential: 'AWS D1.1', duration: '12 months' },
                    { program: 'Plumbing', hours: '2,000 OJT hours', credential: 'NCCER Level 1', duration: '12 months' },
                  ].map((item) => (
                    <div key={item.program} className="bg-white/5 rounded-lg p-3 text-sm">
                      <div className="font-semibold text-white">{item.program}</div>
                      <div className="text-slate-400 text-xs mt-1">
                        {item.hours} · {item.credential} · ~{item.duration}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/20 border border-brand-orange-400/30 rounded-xl p-5">
                  <h4 className="font-bold text-brand-orange-300 text-sm mb-2">
                    Barbershop owners: This is built for you
                  </h4>
                  <p className="text-sm text-slate-300">
                    Our barber apprenticeship program is specifically designed for shop owners who
                    want to train the next generation. You get a motivated apprentice, OJT wage
                    reimbursement, and Elevate handles all the PLA paperwork and hour tracking.
                  </p>
                  <Link
                    href="/programs/barber-apprenticeship/host-shops"
                    className="text-brand-orange-300 text-sm font-semibold mt-2 inline-flex items-center hover:text-brand-orange-200"
                  >
                    Learn about hosting a barber apprentice <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employer Partners Section */}
      <EmployerPartners variant="full" showStats={true} showCTA={false} />

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Hire Smarter?
          </h2>
          <p className="text-lg text-brand-orange-100 mb-4 max-w-2xl mx-auto">
            Whether you need one hire or twenty, Elevate can connect you with trained candidates
            and help you access every dollar of workforce funding you are entitled to.
          </p>
          <p className="text-sm text-brand-orange-200 mb-8 max-w-xl mx-auto">
            No contracts. No fees. No obligation. Just a conversation about what you need
            and what programs are available for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?type=employer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-orange-600 font-bold rounded-lg hover:bg-white transition text-lg"
            >
              Contact Our Employer Team <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/partners/training-sites"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-orange-700 text-white font-bold rounded-lg hover:bg-brand-orange-800 transition"
            >
              View Current Training Sites
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
