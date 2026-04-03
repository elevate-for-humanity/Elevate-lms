import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Users, Briefcase, Building2, GraduationCap, Shield, Handshake,
  ArrowRight, Phone, ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partners | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity. Workforce agencies, employers, training providers, barbershops, reentry organizations, and community partners.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
};

const PARTNER_TYPES = [
  {
    icon: Users,
    color: 'blue',
    title: 'Workforce Agencies',
    who: 'WorkOne centers, workforce boards, DWD case managers, and WIOA service providers.',
    what: 'Refer WIOA, Workforce Ready Grant, and Job Ready Indy participants to Elevate for funded career training. We handle enrollment, training, testing, and outcome reporting.',
    steps: [
      'Contact us to set up a referral agreement',
      'Send participant referrals via our intake form',
      'We enroll, train, and report outcomes back to your agency',
    ],
    cta: { label: 'Learn More', href: '/partners/workforce' },
    apply: { label: 'Start a Referral Partnership', href: '/apply/intake' },
    image: '/images/pages/workforce-partners-page-1.jpg',
  },
  {
    icon: Briefcase,
    color: 'green',
    title: 'Employers & OJT Hosts',
    who: 'Businesses looking to hire certified workers or host on-the-job training at their facility.',
    what: 'Post open positions, receive pre-screened certified graduates, and access OJT wage reimbursement through WIOA. No recruiting fees.',
    steps: [
      'Complete the employer partner application',
      'Tell us what roles you are hiring for',
      'We match you with certified graduates and coordinate interviews',
    ],
    cta: { label: 'Learn More', href: '/partnerships' },
    apply: { label: 'Apply as Employer Partner', href: '/apply/employer' },
    image: '/images/pages/employer-handshake.jpg',
  },
  {
    icon: Building2,
    color: 'red',
    title: 'Barbershop Partners',
    who: 'Licensed barbershop owners in Indiana who want to host apprentices through the state Registered Apprenticeship program.',
    what: 'Host barber apprentices at your shop. Elevate handles the DOL registration, curriculum, and compliance paperwork. You provide the chair and mentorship.',
    steps: [
      'Review the apprenticeship host requirements',
      'Sign the Memorandum of Understanding (MOU)',
      'Receive your first apprentice placement',
    ],
    cta: { label: 'Learn More', href: '/partners/barbershop-apprenticeship' },
    apply: { label: 'Apply to Host an Apprentice', href: '/partners/barbershop-apprenticeship/apply' },
    image: '/images/pages/barber-shop-interior.jpg',
  },
  {
    icon: GraduationCap,
    color: 'blue',
    title: 'Training Providers',
    who: 'Schools, training centers, and instructors who want to co-deliver programs or get listed on the Indiana ETPL.',
    what: 'Co-deliver programs under the Elevate umbrella, access funded student referrals, and use our LMS platform for enrollment and compliance tracking.',
    steps: [
      'Submit your provider application and program details',
      'We review your credentials and program outcomes',
      'Sign the provider agreement and begin receiving referrals',
    ],
    cta: { label: 'Learn More', href: '/partners/training-provider' },
    apply: { label: 'Apply as Training Provider', href: '/apply/program-holder' },
    image: '/images/pages/tech-classroom.jpg',
  },
  {
    icon: Shield,
    color: 'green',
    title: 'Reentry Organizations',
    who: 'Community corrections, probation departments, reentry nonprofits, and case managers serving justice-involved individuals.',
    what: 'Connect your clients to Job Ready Indy-funded career training in trades, CDL, healthcare, and barbering. We work with background-friendly employers and provide wrap-around support.',
    steps: [
      'Contact us to discuss your population and needs',
      'Set up a referral pipeline for Job Ready Indy-eligible participants',
      'We enroll, train, and report employment outcomes',
    ],
    cta: { label: 'Learn More', href: '/partners/reentry' },
    apply: { label: 'Refer a Participant', href: '/apply/intake' },
    image: '/images/pages/community-page-4.jpg',
  },
  {
    icon: Handshake,
    color: 'red',
    title: 'Technology Partners',
    who: 'Software vendors, LMS providers, and workforce data platforms seeking API integration or white-label licensing.',
    what: 'Integrate with the Elevate platform via API, license our LMS for your organization, or build data interoperability for workforce outcome reporting.',
    steps: [
      'Review our API documentation and licensing options',
      'Schedule a technical discovery call',
      'Sign a data sharing or licensing agreement',
    ],
    cta: { label: 'Learn More', href: '/partners/technology' },
    apply: { label: 'Request API Access', href: '/partners/sales' },
    image: '/images/pages/technology-sector.jpg',
  },
];

const C = {
  blue:  { border: 'border-brand-blue-200',  badge: 'bg-brand-blue-100 text-brand-blue-700',  label: 'text-brand-blue-600',  btn: 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white',  outline: 'border-2 border-brand-blue-300 text-brand-blue-700 hover:bg-brand-blue-50'  },
  green: { border: 'border-brand-green-200', badge: 'bg-brand-green-100 text-brand-green-700', label: 'text-brand-green-600', btn: 'bg-brand-green-600 hover:bg-brand-green-700 text-white', outline: 'border-2 border-brand-green-300 text-brand-green-700 hover:bg-brand-green-50' },
  red:   { border: 'border-brand-red-200',   badge: 'bg-brand-red-100 text-brand-red-700',     label: 'text-brand-red-600',   btn: 'bg-brand-red-600 hover:bg-brand-red-700 text-white',     outline: 'border-2 border-brand-red-300 text-brand-red-700 hover:bg-brand-red-50'   },
} as const;

export default function PartnersIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partners' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[50vh] sm:h-[55vh] min-h-[300px] overflow-hidden">
          <Image src="/images/pages/workforce-partnership-hero.jpg" alt="Workforce partnership meeting" fill sizes="100vw" className="object-cover object-center" priority />
        </div>
        <div className="bg-white py-10 border-t">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="font-semibold text-sm mb-2 uppercase tracking-wide text-brand-blue-600">Indianapolis, Indiana</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-3">Partner With Elevate</h1>
            <p className="text-lg text-black max-w-3xl mx-auto">
              We work with workforce agencies, employers, barbershops, training providers, and reentry organizations. Find your type below and apply in minutes.
            </p>
          </div>
        </div>
      </section>

      {/* 3-step directions */}
      <section className="border-b border-slate-100 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-lg font-bold text-slate-900 mb-6 text-center">How to get started</h2>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { step: '1', heading: 'Find your type', body: 'Scroll down and identify which partnership category fits your organization.' },
              { step: '2', heading: 'Read what is required', body: 'Each section explains who qualifies, what you get, and what we need from you.' },
              { step: '3', heading: 'Apply or call us', body: 'Click the application button for your type, or call (317) 314-3757 to talk first.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-blue-600 text-white font-extrabold text-lg flex items-center justify-center flex-shrink-0">{s.step}</div>
                <h3 className="font-bold text-slate-900">{s.heading}</h3>
                <p className="text-black text-sm">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner type cards */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col gap-8">
          {PARTNER_TYPES.map((type) => {
            const c = C[type.color as keyof typeof C];
            return (
              <div key={type.title} className={`bg-white rounded-2xl border-2 ${c.border} overflow-hidden shadow-sm`}>
                <div className="grid md:grid-cols-5">
                  {/* Image — no text overlay */}
                  <div className="relative md:col-span-2 h-52 md:h-auto">
                    <Image
                      src={type.image}
                      alt={type.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="md:col-span-3 p-6 flex flex-col gap-4">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold self-start ${c.badge}`}>
                      <type.icon className="w-3.5 h-3.5" />
                      {type.title}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${c.label}`}>Who this is for</p>
                      <p className="text-slate-700 text-sm leading-relaxed">{type.who}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${c.label}`}>What you get</p>
                      <p className="text-slate-700 text-sm leading-relaxed">{type.what}</p>
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${c.label}`}>How to get started</p>
                      <ol className="flex flex-col gap-1.5">
                        {type.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${c.badge}`}>{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-100">
                      <Link href={type.apply.href} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-colors ${c.btn}`}>
                        {type.apply.label} <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link href={type.cta.href} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${c.outline}`}>
                        {type.cta.label} <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Not sure which type fits?</h2>
          <p className="text-black mb-6">Call us and we will figure it out together. Most partnerships are set up within a week.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:317-314-3757" className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
            <Link href="/partners/join" className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-lg font-bold hover:bg-white transition-colors">
              General Partner Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
