import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { AuthorityStrip } from '@/components/InstitutionalAuthority';
import { GraduationCap, Clock, Award, DollarSign, ArrowRight, Users, FileText, Phone, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment | Elevate for Humanity',
  description: 'Enroll in workforce training programs. HVAC, CNA, CDL, Barber, and more. WIOA and Workforce Ready Grant eligible. Financing available for those who do not qualify.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/enrollment' },
};

const FEATURED = [
  {
    name: 'HVAC Technician',
    hours: '400+', weeks: '12', credentials: '6',
    href: '/apply/student?program=hvac-technician',
    image: '/images/pages/card-hvac.jpg',
    tag: 'Trades',
  },
  {
    name: 'Certified Nursing Assistant',
    hours: '120', weeks: '6', credentials: '2',
    href: '/apply/student?program=cna',
    image: '/images/pages/card-cna.jpg',
    tag: 'Healthcare',
  },
  {
    name: 'CDL Class A',
    hours: '160', weeks: '4', credentials: '3',
    href: '/apply/student?program=cdl',
    image: '/images/pages/card-cdl.jpg',
    tag: 'Transportation',
  },
  {
    name: 'Barber / Cosmetology',
    hours: '1500', weeks: '52', credentials: '4',
    href: '/apply/student?program=barber-apprenticeship',
    image: '/images/pages/barber-apprenticeship.jpg',
    tag: 'Cosmetology',
  },
  {
    name: 'Electrical Apprenticeship',
    hours: '400+', weeks: '20', credentials: '4',
    href: '/apply/student?program=electrical',
    image: '/images/pages/electrical.jpg',
    tag: 'Trades',
  },
  {
    name: 'Forklift Operator',
    hours: '40', weeks: '1', credentials: '2',
    href: '/apply/student?program=forklift',
    image: '/images/pages/forklift.jpg',
    tag: 'Logistics',
  },
];

const STEPS = [
  { step: '1', title: 'Apply', desc: 'Complete the student application. Takes about 5 minutes.', href: '/apply/student', cta: 'Start Application' },
  { step: '2', title: 'Review', desc: 'Our team reviews your application and contacts you within 1–2 business days.', href: null, cta: null },
  { step: '3', title: 'Enroll', desc: 'Sign the enrollment agreement, submit required documents, and confirm funding.', href: null, cta: null },
  { step: '4', title: 'Start Training', desc: 'Complete orientation, access the LMS, and begin your program.', href: '/enrollment/orientation', cta: 'View Orientation' },
];

const FUNDING = [
  {
    title: 'WIOA Funding',
    desc: 'Workforce Innovation and Opportunity Act covers tuition, materials, and exam fees for eligible adults, dislocated workers, and youth 16–24.',
    icon: DollarSign,
    cta: 'Check WIOA Eligibility',
    href: '/funding/federal-programs',
    badge: 'Federal',
  },
  {
    title: 'Workforce Ready Grant',
    desc: "Indiana's state grant covers training costs for high-demand certifications. Available to Indiana residents pursuing approved programs.",
    icon: FileText,
    cta: 'Check WRG Eligibility',
    href: '/funding/state-programs',
    badge: 'Indiana State',
  },
  {
    title: 'Employer Sponsorship',
    desc: 'Partner employers may sponsor training costs with OJT wage reimbursement. Ask your employer or let us connect you with a hiring partner.',
    icon: Users,
    cta: 'Find Employer Partners',
    href: '/partners/employers',
    badge: 'OJT',
  },
];

export default async function EnrollmentPage() {
  const supabase = await createClient();
  let livePrograms: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('programs')
      .select('id, name, slug, status, description')
      .eq('status', 'active')
      .order('name')
      .limit(20);
    livePrograms = data ?? [];
  }

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Enrollment' }]} />

      {/* Hero — image only, title below */}
      <section className="relative w-full">
        <div className="relative h-[50vh] min-h-[320px] overflow-hidden">
          <Image
            src="/images/pages/enrollment-page-1.jpg"
            alt="Elevate for Humanity enrollment"
            fill sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>
        <div className="bg-white border-t py-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-3">Enroll in a Program</h1>
          <p className="text-black text-lg max-w-2xl mx-auto mb-8">
            Short-term training. Real credentials. Most programs available at no cost to eligible Indiana residents.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply/student" className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
              Apply Now — Free
            </Link>
            <Link href="/check-eligibility" className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base">
              Check Funding Eligibility
            </Link>
            <a href="tel:3173143757" className="border-2 border-black text-black font-bold px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors text-base flex items-center gap-2">
              <Phone className="w-4 h-4" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>

      {/* Authority strip */}
      <div className="py-4 border-b border-slate-200">
        <AuthorityStrip />
      </div>

      {/* How Enrollment Works */}
      <section className="bg-slate-900 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-2">How Enrollment Works</h2>
          <p className="text-white text-center mb-12 max-w-xl mx-auto">From application to first day of class in as little as 5 business days.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative text-center">
                <div className="w-14 h-14 rounded-full bg-brand-blue-600 text-white flex items-center justify-center text-xl font-black mx-auto mb-4">{s.step}</div>
                {i < 3 && <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-px bg-white/20" />}
                <h3 className="font-bold text-white text-base mb-2">{s.title}</h3>
                <p className="text-white text-sm leading-relaxed mb-3">{s.desc}</p>
                {s.href && s.cta && (
                  <Link href={s.href} className="text-xs font-bold text-white underline underline-offset-2 hover:text-brand-blue-300 transition-colors">
                    {s.cta} →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-black text-center mb-2">Available Programs</h2>
          <p className="text-black text-center mb-10">Select a program to begin your application</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED.map((p) => (
              <Link key={p.name} href={p.href} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all group flex flex-col">
                {/* Image — no text overlay */}
                <div className="relative h-48 overflow-hidden flex-shrink-0">
                  <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-blue-100 text-brand-blue-800 mb-2 self-start">{p.tag}</span>
                  <h3 className="text-lg font-bold text-black mb-3">{p.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-black mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {p.hours} hrs</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {p.weeks} wks</span>
                    <span className="flex items-center gap-1"><Award className="w-3 h-3" /> {p.credentials} creds</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-800 font-bold">WIOA Eligible</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-blue-100 text-brand-blue-800 font-bold">ETPL Listed</span>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-sm font-bold text-brand-blue-600 group-hover:text-brand-blue-700">
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Live programs from DB */}
          {livePrograms.length > 0 && (
            <div className="mt-10 text-center">
              <Link href="/programs" className="inline-flex items-center gap-2 border-2 border-black text-black font-bold px-8 py-3.5 rounded-xl hover:bg-slate-50 transition-colors">
                View All {livePrograms.length} Programs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Funding Options */}
      <section className="bg-slate-50 py-16 px-4 border-t border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-black text-center mb-2">Funding Options</h2>
          <p className="text-black text-center mb-10 max-w-2xl mx-auto">Most eligible Indiana residents pay $0. Multiple funding sources available.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {FUNDING.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-800">{f.badge}</span>
                </div>
                <h3 className="font-bold text-black text-base mb-2">{f.title}</h3>
                <p className="text-black text-sm leading-relaxed flex-1 mb-4">{f.desc}</p>
                <Link href={f.href} className="text-sm font-bold text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1">
                  {f.cta} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>

          {/* Don't qualify section */}
          <div className="bg-slate-900 rounded-2xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-black text-white mb-3">Don't Qualify for Funding?</h3>
                <p className="text-white mb-4 leading-relaxed">
                  Out-of-state residents, those who have exhausted WIOA benefits, or those who don't meet income requirements can still enroll through our self-pay and financing options.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    'Payment plans starting at $99/month',
                    'Affirm financing — apply in 60 seconds',
                    'Employer tuition reimbursement accepted',
                    'Veterans benefits (GI Bill) accepted',
                    'No-interest installment plans available',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-white text-sm">
                      <CheckCircle className="w-4 h-4 text-brand-green-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Link href="/apply/student?funding=self-pay" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-colors text-sm">
                    Apply — Self Pay
                  </Link>
                  <Link href="/financing" className="border-2 border-white text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm">
                    View Financing Options
                  </Link>
                </div>
              </div>
              <div className="relative h-64 rounded-xl overflow-hidden">
                <Image
                  src="/images/pages/about-career-pathways.jpg"
                  alt="Career pathways for all students"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-blue-700 py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Start?</h2>
          <p className="text-white text-lg mb-8">Applications are reviewed within 1–2 business days. No application fee.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply/student" className="bg-white text-black font-black px-10 py-4 rounded-xl hover:bg-slate-100 transition-colors text-lg">
              Apply Now
            </Link>
            <a href="tel:3173143757" className="border-2 border-white text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition-colors text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" /> Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
