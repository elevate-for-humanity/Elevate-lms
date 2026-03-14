export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import SponsorDisclosure from '@/components/compliance/SponsorDisclosure';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  DollarSign, Briefcase, Building2, ArrowRight, 
  Users, Clock, Award, GraduationCap, Zap, Phone 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Apprenticeships | Earn While You Learn | Elevate For Humanity',
  description: 'USDOL Registered Apprenticeship programs in Indiana. Earn a paycheck while learning barbering, cosmetology, HVAC, electrical, and more. Tuition and funding eligibility vary by program.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/apprenticeships' },
};

const benefits = [
  { icon: DollarSign, title: 'Paid Training', color: 'green' },
  { icon: GraduationCap, title: 'State License', color: 'blue' },
  { icon: Users, title: 'Mentorship', color: 'blue' },
  { icon: Award, title: 'Credentials', color: 'orange' },
];


const steps = [
  { num: 1, title: 'Apply', desc: 'Submit your application', image: '/images/pages/apply-employer-hero.jpg' },
  { num: 2, title: 'Interview', desc: 'Meet with employers', image: '/images/pages/healthcare-grad.jpg' },
  { num: 3, title: 'Train', desc: 'Learn on the job', image: '/images/pages/apply-employer-hero.jpg' },
  { num: 4, title: 'Certify', desc: 'Earn your credential', image: '/images/pages/philanthropy-hero.jpg' },
];

export default async function ApprenticeshipsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: dbRows } = await db.from('apprenticeships').select('*').limit(50);
const apprenticeships = (dbRows as any[]) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Apprenticeships' }]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <SponsorDisclosure />
      </div>

      {/* Hero */}
      <section className="relative h-[55vh] min-h-[400px]">
        <Image src="/images/pages/apprenticeships-hero.jpg" alt="Apprenticeship training" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-green-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
              <Zap className="w-4 h-4" /> USDOL Registered Programs
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              Apprenticeships
            </h1>
            <p className="text-xl text-white/90 max-w-xl mb-4">
              Earn a paycheck from day one while learning a skilled trade. Real credentials. Real careers.
            </p>
            <p className="text-sm text-white/70 max-w-xl mb-6">
              Tuition and funding eligibility vary by program. See individual program pages for details.
            </p>
            <Link href="/start" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="py-8 bg-slate-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3 justify-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  b.color === 'green' ? 'bg-brand-green-500' : 
                  b.color === 'blue' ? 'bg-brand-blue-500' : 
                  b.color === 'blue' ? 'bg-brand-blue-500' : 'bg-brand-orange-500'
                }`}>
                  <b.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-semibold">{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is an Apprenticeship */}
      <section className="py-16 bg-brand-blue-600">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-black mb-6">What is an Apprenticeship?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Earn While You Learn</h3>
                    <p className="text-brand-blue-100">Get paid from day one while training on the job with experienced mentors.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Industry Credentials</h3>
                    <p className="text-brand-blue-100">Earn state licenses and nationally recognized certifications.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Job Guarantee</h3>
                    <p className="text-brand-blue-100">You&apos;re already employed - training leads directly to your career.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden shadow-2xl">
              <Image src="/images/pages/apprenticeships-page-2.jpg" alt="Apprentice training" fill sizes="100vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Available Apprenticeships */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Available Programs</h2>
          <p className="text-center text-slate-600 mb-12">Choose your career path</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apprenticeships.map((prog, i) => (
              <Link key={i} href={prog.href} className="group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-slate-200">
                  <div className="relative h-48">
                    <Image src={prog.image} alt={prog.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-xl font-bold text-white">{prog.name}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-slate-600 text-sm mb-4">{prog.description}</p>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-4 h-4" /> {prog.duration}
                      </span>
                      <span className="flex items-center gap-1 text-brand-green-600 font-semibold">
                        <DollarSign className="w-4 h-4" /> {prog.wage}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">How It Works</h2>
          <p className="text-center text-slate-600 mb-12">4 steps to your new career</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="group">
                <div className="relative h-48 rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <Image src={step.image} alt={step.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-4 left-4 w-10 h-10 bg-brand-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.num}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-white/80 text-sm">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Do You Qualify?</h2>
          <p className="text-slate-600 mb-8">Most adults qualify for apprenticeship programs</p>
          
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {[
              '18+ years old',
              'High school diploma or GED',
              'US work authorized',
              'Reliable transportation',
              'Pass background check',
              'Committed to learning',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <span className="font-medium text-slate-700">{item}</span>
              </div>
            ))}
          </div>
          
          <Link href="/wioa-eligibility" className="inline-flex items-center gap-2 bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-105">
            Check Eligibility <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900">
        {/* Registered Apprenticeship Authority */}
        <div className="max-w-5xl mx-auto px-4 mb-16">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Registered Apprenticeship Authority</h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              Elevate for Humanity Career &amp; Training Institute administers apprenticeship programs under a sponsor-led model. As the sponsor of record, 2Exclusive LLC-S oversees standards, curriculum alignment, apprentice registration, hour tracking, and compliance reporting. Apprentices complete supervised on-the-job training at approved licensed partner sites while receiving structured related technical instruction through the institute.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">RAPIDS Program</p>
                <p className="font-bold text-slate-900">2025-IN-132301</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Federal Oversight</p>
                <p className="font-bold text-slate-900">U.S. DOL Office of Apprenticeship</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Registered Occupations</p>
                <p className="font-bold text-slate-900">Barber, Esthetician, Nail Tech, Hair Stylist, Building Services Technician, Youth Culinary</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">RTI Delivery</p>
                <p className="font-bold text-slate-900">Classroom + Web-Based Learning (LMS)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Start Your Apprenticeship
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Real pay. Industry credentials. Funding options available.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/start" className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all hover:scale-105">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="/support" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all border border-white/30">
              <Phone className="w-5 h-5" /> (317) 314-3757
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
