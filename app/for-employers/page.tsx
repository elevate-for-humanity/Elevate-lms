import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Award,
  DollarSign,
  ArrowRight,
  Building2,
  Briefcase,
  Shield,
  Clock,
  CheckCircle,
  FileText,
  Phone,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'For Employers | Hire Trained Workers | Elevate for Humanity',
  description:
    'Partner with Elevate for Humanity to hire job-ready, certified candidates. Access our talent pipeline, build apprenticeships, claim WOTC tax credits, and grow your workforce at no cost.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/for-employers',
  },
  openGraph: {
    title: 'For Employers | Elevate for Humanity',
    description:
      'Hire trained, certified candidates. Access talent pipelines, apprenticeships, and WOTC tax credits.',
  },
};

export const revalidate = 600;

export default async function ForEmployersPage() {
  let employerCount: number | null = null;
  let programCount: number | null = null;

  try {
    const db = createAdminClient();
    const { count: ec } = await db
      .from('employer_profiles')
      .select('*', { count: 'exact', head: true });
    employerCount = ec;

    const { count: pc } = await db
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    programCount = pc;
  } catch {
    // DB may not be available
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'For Employers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative h-[200px] sm:h-[260px] w-full overflow-hidden">
        <Image src="/images/pages/for-employers-page-1.jpg" alt="Employer partner meeting with Elevate for Humanity team" fill className="object-cover" priority sizes="100vw" />
      </section>
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Hire Trained, Certified Workers</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">Access our talent pipeline of job-ready candidates trained in healthcare, skilled trades, technology, and business. No recruitment fees. WIOA and WOTC eligible.</p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/employer-portal" className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition text-sm">
              <Building2 className="w-4 h-4" /> Employer Portal
            </Link>
            <Link href="/employers/post-job" className="inline-flex items-center gap-2 border-2 border-slate-300 text-slate-700 px-6 py-2.5 rounded-lg font-bold hover:bg-white transition text-sm">
              Post a Job — Free
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <section className="bg-brand-blue-700 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-blue-400">{programCount ?? '49'}+</p>
              <p className="text-slate-500 text-sm">Training Programs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-green-400">{employerCount ?? '50'}+</p>
              <p className="text-slate-500 text-sm">Employer Partners</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">$0</p>
              <p className="text-slate-500 text-sm">Recruitment Cost</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-400">WIOA</p>
              <p className="text-slate-500 text-sm">Funded Training</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Partner With Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We train candidates to your specifications and deliver them job-ready. You hire with confidence.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                image: '/images/pages/employers-page-1.jpg',
                alt: 'Pre-screened talent pipeline of certified graduates',
                title: 'Pre-Screened Talent Pipeline',
                description: 'Candidates complete background checks, drug testing, and skills assessments before referral. You interview only qualified applicants.',
              },
              {
                image: '/images/pages/admin-funding-hero.jpg',
                alt: 'WOTC tax credit documentation and processing',
                title: 'WOTC Tax Credits',
                description: 'Claim up to $9,600 per eligible hire through the Work Opportunity Tax Credit. We handle the paperwork.',
              },
              {
                image: '/images/pages/employers-page-2.jpg',
                alt: 'Industry certification exams and credentialing',
                title: 'Industry Certifications',
                description: 'Candidates complete training and sit for recognized credential exams — EPA 608, CDL, CNA, Certiport IT Specialist, barber license, and more — before day one.',
              },
              {
                image: '/images/pages/admin-apprenticeships-hero.jpg',
                alt: 'DOL registered apprenticeship program management',
                title: 'DOL Registered Apprenticeships',
                description: 'Structured earn-and-learn programs with mentorship. We manage compliance, you develop loyal employees.',
              },
              {
                image: '/images/pages/employers-page-3.jpg',
                alt: 'Rapid candidate placement within weeks of training',
                title: 'Rapid Placement',
                description: 'Most programs are 2-16 weeks. We match candidates to your openings as they complete training.',
              },
              {
                image: '/images/pages/admin-apprenticeships-hero.jpg',
                alt: 'No-cost employer recruitment through workforce funding',
                title: 'No Cost to You',
                description: 'Training is funded through WIOA, DOL grants, and institutional funding. You pay nothing for recruitment or training.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                  <Image src={item.image} alt={item.alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            {[
              { step: '1', title: 'Tell Us What You Need', description: 'Share your hiring needs, job requirements, and timeline. We match candidates from our active training programs.' },
              { step: '2', title: 'We Train & Screen Candidates', description: 'Candidates complete industry-specific training, earn certifications, pass background checks, and complete drug testing.' },
              { step: '3', title: 'Interview & Hire', description: 'Review pre-screened candidates, conduct interviews, and hire with confidence. We provide 90-day retention support.' },
              { step: '4', title: 'Claim Tax Credits', description: 'We help you file WOTC paperwork for eligible hires. Credits range from $2,400 to $9,600 per employee.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-brand-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Employer Resources</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Employer Portal', href: '/employer-portal', description: 'Manage jobs, review candidates, track hires', icon: Building2 },
              { title: 'Post a Job', href: '/employers/post-job', description: 'Free job postings to our candidate pool', icon: Briefcase },
              { title: 'Talent Pipeline', href: '/employers/talent-pipeline', description: 'Browse available candidates by skill', icon: Users },
              { title: 'Apprenticeships', href: '/employers/apprenticeships', description: 'DOL registered earn-and-learn programs', icon: Award },
              { title: 'Employer Benefits', href: '/employers/benefits', description: 'WOTC credits, OJT reimbursement, more', icon: DollarSign },
              { title: 'Drug Testing', href: '/drug-testing/employer-programs', description: 'DOT and non-DOT workplace testing', icon: Shield },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border hover:shadow-md transition"
              >
                <div className="w-10 h-10 bg-brand-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Hire?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            Contact our employer services team to discuss your hiring needs. We&apos;ll match you with trained, certified candidates at no cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employer-portal"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-white transition text-lg"
            >
              <Building2 className="w-5 h-5" />
              Employer Portal
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition text-lg"
            >
              <Phone className="w-5 h-5" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
