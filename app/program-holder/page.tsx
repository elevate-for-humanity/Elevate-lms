import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import {
  Building2, BookOpen, Users, BarChart3, FileText, Settings,
  ShieldCheck, ClipboardCheck, Eye, Scale, GraduationCap,
  Store, Wrench, UserCheck, Clock, Handshake, DollarSign, Ban,
  LayoutDashboard, ArrowRight, LogIn,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate For Humanity',
  description: 'Manage your training programs, track student progress, and access program management tools.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder',
  },
};

const features = [
  { icon: BookOpen, title: 'Program Management', description: 'Create and manage training programs, curricula, and course content.' },
  { icon: Users, title: 'Student Tracking', description: 'Monitor student enrollment, progress, and completion rates.' },
  { icon: BarChart3, title: 'Analytics Dashboard', description: 'View detailed reports on program performance and outcomes.' },
  { icon: FileText, title: 'Compliance Reports', description: 'Generate WIOA compliance and funding reports automatically.' },
  { icon: Building2, title: 'Partner Network', description: 'Connect with employers and workforce agencies.' },
  { icon: Settings, title: 'Program Settings', description: 'Configure program requirements, schedules, and pricing.' },
];

export default async function ProgramHolderLanding() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  let isProgramHolder = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    isProgramHolder = profile?.role === 'program_holder';
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Program Holder' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-48 md:h-80 flex items-end overflow-hidden bg-slate-900">
        <Image src="/images/pages/program-holder-page-2.jpg" alt="Program Holder Portal" fill className="object-cover opacity-50" priority />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Program Holder Portal</h1>
          <p className="text-white/80 text-lg mb-6 max-w-2xl">
            Partner with Elevate to deliver workforce training under our government credentials — ETPL, WIOA, DOL Registered Apprenticeship, and more.
          </p>
          <div className="flex flex-wrap gap-3">
            {isProgramHolder ? (
              <Link href="/program-holder/dashboard" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-7 py-3 rounded-lg font-bold text-base hover:bg-brand-blue-700 transition">
                <LayoutDashboard className="w-5 h-5" /> Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/apply/program-holder" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-7 py-3 rounded-lg font-bold text-base hover:bg-brand-blue-700 transition">
                  Apply to Join Network <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login?redirect=/program-holder/dashboard" className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-7 py-3 rounded-lg font-semibold text-base hover:bg-white/20 transition">
                  <LogIn className="w-5 h-5" /> Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Auth-aware action strip */}
      {isProgramHolder ? (
        <section className="bg-brand-green-50 border-b border-brand-green-100 py-4">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-brand-green-900 font-medium text-sm">You&apos;re logged in as a Program Holder. Jump straight to your portal.</p>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/program-holder/dashboard" className="inline-flex items-center gap-2 bg-brand-green-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-green-700 transition">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/program-holder/students" className="inline-flex items-center gap-2 border border-brand-green-600 text-brand-green-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-green-100 transition">
                <Users className="w-4 h-4" /> Students
              </Link>
              <Link href="/program-holder/reports" className="inline-flex items-center gap-2 border border-brand-green-600 text-brand-green-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-green-100 transition">
                <FileText className="w-4 h-4" /> Reports
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-brand-blue-50 border-b border-brand-blue-100 py-4">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-brand-blue-900 font-medium text-sm">Already a program holder? Log in to access your dashboard, students, and reports.</p>
            <div className="flex gap-3 flex-shrink-0">
              <Link href="/login?redirect=/program-holder/dashboard" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition">
                <LogIn className="w-4 h-4" /> Log In
              </Link>
              <Link href="/apply/program-holder" className="inline-flex items-center gap-2 border border-brand-blue-600 text-brand-blue-700 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-brand-blue-100 transition">
                Apply Now
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border">
                <feature.icon className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barber on File */}
      <section className="py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-teal-700 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Barber on File</h2>
          </div>
          <p className="text-sm text-teal-700 font-semibold uppercase tracking-wide mb-6">Licensed Supervising Barber — Apprenticeship Program</p>
          <p className="text-slate-700 mb-6">
            The barber on file is the licensed professional responsible for supervising and verifying the training of apprentices working in the shop.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Eye className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Direct Supervision of Apprentices</h3>
                <p className="text-sm text-slate-600">Supervises apprentices while they perform barber services, ensuring all work is done safely and according to barber board sanitation standards.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ClipboardCheck className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Hour Verification &amp; Training Logs</h3>
                <p className="text-sm text-slate-600">Reviews and verifies apprentice hours and training logs, and signs off on progress documentation required for the apprenticeship program.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Scale className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Shop Compliance &amp; Barber Board Standards</h3>
                <p className="text-sm text-slate-600">Ensures the shop environment follows barber board regulations, including supervision ratios and sanitation procedures.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <GraduationCap className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Progress Evaluation &amp; Completion Sign-Off</h3>
                <p className="text-sm text-slate-600">Confirms when an apprentice has successfully completed the required training and is ready to move forward toward licensing.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Owner */}
      <section className="py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-7 h-7 text-teal-700 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Shop Owner Responsibilities</h2>
          </div>
          <p className="text-sm text-teal-700 font-semibold uppercase tracking-wide mb-6">Licensed Shop — Apprenticeship Training Site</p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Scale className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Shop License &amp; Regulatory Compliance</h3>
                <p className="text-sm text-slate-600">Maintain a valid shop license and ensure the shop meets all barber board health, sanitation, and safety regulations.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Wrench className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Equipment &amp; Workstations</h3>
                <p className="text-sm text-slate-600">Provide the required barber equipment and workstations so apprentices can perform services safely.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <UserCheck className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Apprentice Registration &amp; Permits</h3>
                <p className="text-sm text-slate-600">Ensure apprentices are properly registered with the state barber board before they begin performing services.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Training Hours &amp; Scheduling</h3>
                <p className="text-sm text-slate-600">Allow apprentices to complete their required on-the-job training hours and provide reasonable scheduling.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Handshake className="w-6 h-6 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Cooperation with Sponsor &amp; Barber on File</h3>
                <p className="text-sm text-slate-600">Cooperate with the apprenticeship sponsor and barber on file by allowing oversight of training activities.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compensation */}
      <section className="py-16 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-7 h-7 text-teal-700 flex-shrink-0" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Apprentice Compensation</h2>
          </div>
          <p className="text-sm text-teal-700 font-semibold uppercase tracking-wide mb-6">Pay Structure &amp; Wage Requirements</p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <Ban className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 mb-1">Sole Commission Is Not Permitted</h3>
                <p className="text-sm text-red-800">Apprentices must receive at least minimum wage for all hours worked. Commission-only pay violates FLSA and DOL registered apprenticeship standards.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-1">Base Hourly Wage (Required)</h4>
              <p className="text-sm text-slate-600">At or above minimum wage for all hours worked, including OJT hours.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-1">Optional Commission on Services</h4>
              <p className="text-sm text-slate-600">Commission may supplement the base wage but cannot replace it.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-1">Progressive Wage Increases</h4>
              <p className="text-sm text-slate-600">Wages increase as the apprentice advances through the program and completes training milestones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Our Network?</h2>
          <p className="text-white/80 mb-8 text-lg">Application takes 15–20 minutes. Decision in 2–3 days.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/apply/program-holder" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-blue-700 transition">
              Apply Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login?redirect=/program-holder/dashboard" className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/20 transition">
              <LogIn className="w-5 h-5" /> Log In to Portal
            </Link>
          </div>
          <p className="mt-6 text-white/60 text-sm">
            Questions? Call <a href="tel:3173143757" className="underline">(317) 314-3757</a> or visit our <Link href="/platform/program-holders" className="underline">program holder info page</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
