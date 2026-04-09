import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Award, Clock, AlertTriangle, ExternalLink,
  FileText, Calendar, ArrowRight, Lock, CheckCircle2,
} from 'lucide-react';
import { IPLA_EXAM_INFO, IPLA_EXAM_FEES } from '@/lib/payment-config';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State Board Exam | Indiana IPLA',
  description: 'Schedule your Indiana Professional Licensing Agency state board exam.',
};

const REQUIRED_HOURS: Record<string, number> = {
  'cosmetology-apprenticeship':       1500,
  'barber-apprenticeship':            2000,
  'esthetician-apprenticeship':        700,
  'nail-technician-apprenticeship':    450,
};

export default async function StateBoardExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/state-board');

  // Canonical enrollment source
  const { data: programEnrollment } = await supabase
    .from('program_enrollments')
    .select('program_slug, enrolled_at, status')
    .eq('user_id', user.id)
    .in('program_slug', Object.keys(REQUIRED_HOURS))
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Legacy enrollment for extra fields (lms_completed, practical_skills_verified, transfer_hours)
  const { data: legacyEnrollment } = await supabase
    .from('student_enrollments')
    .select('program_slug, required_hours, transfer_hours, lms_completed, practical_skills_verified')
    .eq('student_id', user.id)
    .maybeSingle();

  const programSlug =
    programEnrollment?.program_slug ??
    legacyEnrollment?.program_slug ??
    'cosmetology-apprenticeship';

  const requiredHours =
    legacyEnrollment?.required_hours ??
    REQUIRED_HOURS[programSlug] ??
    1500;

  // Hours from apprentice_hours (canonical PWA source) — approved only
  const { data: approvedRows } = await supabase
    .from('apprentice_hours')
    .select('hours')
    .eq('user_id', user.id)
    .eq('status', 'approved');

  const pwaHours = (approvedRows ?? []).reduce((sum, r) => sum + (r.hours ?? 0), 0);
  const transferHours = legacyEnrollment?.transfer_hours ?? 0;
  const totalHours = pwaHours + transferHours;

  const hoursComplete  = totalHours >= requiredHours;
  const lmsComplete    = legacyEnrollment?.lms_completed ?? false;
  const skillsVerified = legacyEnrollment?.practical_skills_verified ?? false;
  const isReady        = hoursComplete && lmsComplete;

  let examInfo = IPLA_EXAM_INFO.cosmetology;
  if (programSlug.includes('barber'))      examInfo = IPLA_EXAM_INFO.barber;
  else if (programSlug.includes('esthet')) examInfo = IPLA_EXAM_INFO.esthetician;
  else if (programSlug.includes('nail'))   examInfo = IPLA_EXAM_INFO.nail;

  const examFee  = IPLA_EXAM_FEES[programSlug] ?? 50;
  const remaining = Math.max(0, requiredHours - totalHours);
  const pct       = Math.min(100, Math.round((totalHours / requiredHours) * 100));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Breadcrumbs items={[
          { label: 'Apprentice Portal', href: '/apprentice' },
          { label: 'State Board Exam' },
        ]} />

        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Award className="w-7 h-7 text-purple-600" />
            Indiana State Board Exam
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Indiana Professional Licensing Agency (IPLA) — {examInfo.examProvider}
          </p>
        </div>

        {/* Readiness banner */}
        {isReady ? (
          <div className="bg-emerald-600 rounded-2xl p-6 text-white flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">You&apos;re eligible to test</h2>
              <p className="text-emerald-100 text-sm mt-0.5">All requirements complete. Schedule your exam below.</p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-900">Not yet eligible</h2>
              <p className="text-amber-700 text-sm mt-0.5">Complete the requirements below to unlock exam scheduling.</p>
            </div>
          </div>
        )}

        {/* Requirements */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Eligibility Requirements</h3>
          </div>

          {/* Hours */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {hoursComplete
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  : <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-medium text-slate-900">
                    Complete {requiredHours.toLocaleString()} training hours
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {totalHours.toFixed(1)} / {requiredHours.toLocaleString()} hours
                    {transferHours > 0 && ` (includes ${transferHours}h transfer credit)`}
                  </p>
                  <div className="mt-2 w-48 bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${hoursComplete ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
              {hoursComplete ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full whitespace-nowrap">Complete</span>
              ) : (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap">{remaining.toFixed(1)}h remaining</span>
              )}
            </div>
          </div>

          {/* LMS */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {lmsComplete
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />}
                <div>
                  <p className="font-medium text-slate-900">Complete Elevate LMS theory</p>
                  <p className="text-sm text-slate-500">Related Technical Instruction (RTI)</p>
                </div>
              </div>
              {lmsComplete ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">Complete</span>
              ) : (
                <Link href="/lms/dashboard" className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full hover:bg-purple-100 transition-colors whitespace-nowrap">
                  Open LMS →
                </Link>
              )}
            </div>
          </div>

          {/* Practical skills */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {skillsVerified
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  : <Clock className="w-5 h-5 text-slate-300 flex-shrink-0" />}
                <div>
                  <p className="font-medium text-slate-900">Practical skills verified</p>
                  <p className="text-sm text-slate-500">Mentor sign-off on hands-on competencies</p>
                </div>
              </div>
              <Link href="/apprentice/competencies" className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors whitespace-nowrap">
                View skills →
              </Link>
            </div>
          </div>

          {/* Exam fee */}
          <div className="px-5 py-4 bg-emerald-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900">State board exam fee — ${examFee}</p>
                  <p className="text-sm text-slate-500">Included in your program tuition</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">Paid</span>
            </div>
          </div>
        </div>

        {/* Scheduling */}
        {isReady ? (
          <div className="bg-white rounded-2xl border-2 border-emerald-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <h3 className="font-semibold text-emerald-900">Schedule your exam</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <a href={examInfo.examProviderUrl} target="_blank" rel="noopener noreferrer"
                  className="group block p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">Schedule exam</h4>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Register for written and practical exams via {examInfo.examProvider}.</p>
                  <span className="text-sm font-semibold text-purple-700 flex items-center gap-1">
                    Go to {examInfo.examProvider} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
                <a href={examInfo.applicationUrl} target="_blank" rel="noopener noreferrer"
                  className="group block p-5 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">License application</h4>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-500 mb-3">Apply for your Indiana license through the IPLA MyLicense portal.</p>
                  <span className="text-sm font-semibold text-purple-700 flex items-center gap-1">
                    MyLicense.IN.gov <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </a>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Written exam:</span> <span className="font-medium text-slate-900">100 questions, 90 min</span></div>
                <div><span className="text-slate-500">Practical exam:</span> <span className="font-medium text-slate-900">Live demonstration</span></div>
                <div><span className="text-slate-500">Passing score:</span> <span className="font-medium text-slate-900">75% on each section</span></div>
                <div><span className="text-slate-500">Exam fee:</span> <span className="font-semibold text-emerald-700">Included in tuition</span></div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={examInfo.boardUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" /> IPLA Board Info
                </a>
                <a href={examInfo.examUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" /> Exam Requirements
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-700 mb-1">Exam scheduling locked</h3>
            <p className="text-sm text-slate-500 mb-4">Complete all requirements above to unlock.</p>
            <Link href="/pwa/cosmetology"
              className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-colors">
              Log hours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Important notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Before you test</h4>
              <ul className="text-sm text-amber-800 space-y-1.5">
                <li>• Bring valid government-issued photo ID to the exam site.</li>
                <li>• Bring your own tools/kit for the practical exam — check IPLA requirements for the approved list.</li>
                <li>• Your exam fee (${examFee}) is included in your tuition and has been paid.</li>
                <li>• Retake fees apply if you do not pass — contact us for assistance.</li>
                <li>• After passing both sections, apply for your license at MyLicense.IN.gov.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <h4 className="font-semibold text-slate-900 mb-1">Questions?</h4>
          <p className="text-sm text-slate-500 mb-4">We&apos;re here to help you get licensed.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:3173143757"
              className="text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors">
              Call 317-314-3757
            </a>
            <a href="/contact"
              className="text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors">
              Email support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
