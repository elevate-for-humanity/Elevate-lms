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

export const dynamic = 'force-dynamic';

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
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'For Employers' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[350px] md:h-[450px] w-full overflow-hidden">
          <Image
            src="/images/heroes-hq/employer-hero.jpg"
            alt="Employer partner meeting with Elevate for Humanity team"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
                Hire Trained, Certified Workers
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8">
                Access our talent pipeline of job-ready candidates trained in healthcare, skilled trades, technology, and business. No recruitment fees. WIOA and WOTC eligible.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/employer-portal"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition text-lg"
                >
                  <Building2 className="w-5 h-5" />
                  Employer Portal
                </Link>
                <Link
                  href="/employers/post-job"
                  className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition text-lg"
                >
                  Post a Job — Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-900 text-white py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-blue-400">{programCount ?? '49'}+</p>
              <p className="text-slate-400 text-sm">Training Programs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-green-400">{employerCount ?? '50'}+</p>
              <p className="text-slate-400 text-sm">Employer Partners</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">$0</p>
              <p className="text-slate-400 text-sm">Recruitment Cost</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pink-400">WIOA</p>
              <p className="text-slate-400 text-sm">Funded Training</p>
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
                icon: Users,
                title: 'Pre-Screened Talent Pipeline',
                description: 'Candidates complete background checks, drug testing, and skills assessments before referral. You interview only qualified applicants.',
                color: 'bg-brand-blue-50 text-brand-blue-600',
              },
              {
                icon: DollarSign,
                title: 'WOTC Tax Credits',
                description: 'Claim up to $9,600 per eligible hire through the Work Opportunity Tax Credit. We handle the paperwork.',
                color: 'bg-brand-green-50 text-brand-green-600',
              },
              {
                icon: Award,
                title: 'Industry Certifications',
                description: 'Candidates earn recognized credentials — EPA 608, CDL, CNA, CompTIA, barber license, and more — before day one.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: Shield,
                title: 'DOL Registered Apprenticeships',
                description: 'Structured earn-and-learn programs with mentorship. We manage compliance, you develop loyal employees.',
                color: 'bg-indigo-50 text-indigo-600',
              },
              {
                icon: Clock,
                title: 'Rapid Placement',
                description: 'Most programs are 2-16 weeks. We match candidates to your openings as they complete training.',
                color: 'bg-pink-50 text-pink-600',
              },
              {
                icon: FileText,
                title: 'No Cost to You',
                description: 'Training is funded through WIOA, DOL grants, and institutional funding. You pay nothing for recruitment or training.',
                color: 'bg-teal-50 text-teal-600',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border p-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} mb-4`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
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
      <section className="py-16 bg-brand-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Hire?</h2>
          <p className="text-brand-blue-100 mb-8 text-lg">
            Contact our employer services team to discuss your hiring needs. We&apos;ll match you with trained, certified candidates at no cost.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/employer-portal"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition text-lg"
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
