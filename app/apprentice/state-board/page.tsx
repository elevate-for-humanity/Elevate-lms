

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { 
  Award, 
  
  Clock, 
  AlertTriangle,
  ExternalLink,
  FileText,
  Calendar,
  DollarSign,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { IPLA_EXAM_INFO, IPLA_EXAM_FEES } from '@/lib/payment-config';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State Board Exam | Indiana IPLA',
  description: 'Schedule your Indiana Professional Licensing Agency state board exam.',
};

export default async function StateBoardExamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get student enrollment
  const { data: enrollment } = await supabase
    .from('student_enrollments')
    .select('*')
    .eq('student_id', user.id)
    .single();

  // Get time entries to calculate hours
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('minutes, status')
    .eq('student_id', user.id)
    .eq('status', 'APPROVED');

  const approvedMinutes = timeEntries?.reduce((sum, e) => sum + (e.minutes || 0), 0) || 0;
  const approvedHours = approvedMinutes / 60;
  const transferHours = enrollment?.transfer_hours || 0;
  const totalHours = approvedHours + transferHours;
  const requiredHours = enrollment?.required_hours || 2000;

  // Check readiness
  const hoursComplete = totalHours >= requiredHours;
  const miladyComplete = enrollment?.milady_completed || false;
  const skillsVerified = enrollment?.practical_skills_verified || false;
  const isReady = hoursComplete && miladyComplete;

  // Determine program type for exam info
  const programSlug = enrollment?.program_slug || 'barber-apprenticeship';
  let examInfo = IPLA_EXAM_INFO.barber;
  if (programSlug.includes('cosmetology')) examInfo = IPLA_EXAM_INFO.cosmetology;
  else if (programSlug.includes('esthetician')) examInfo = IPLA_EXAM_INFO.esthetician;
  else if (programSlug.includes('nail')) examInfo = IPLA_EXAM_INFO.nail;

  const examFee = IPLA_EXAM_FEES[programSlug] || 50;

  return (
    <div className="min-h-screen bg-white p-6">
      <Breadcrumbs
        items={[
          { label: 'Apprentice Portal', href: '/apprentice' },
          { label: 'State Board Exam' },
        ]}
      />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black flex items-center gap-3">
            <Award className="w-8 h-8 text-brand-blue-600" />
            Indiana State Board Exam
          </h1>
          <p className="text-slate-600 mt-1">
            Indiana Professional Licensing Agency (IPLA) Examination
          </p>
        </div>

        {/* Readiness Status */}
        {isReady ? (
          <div className="bg-brand-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-slate-500 flex-shrink-0">•</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">You're Ready!</h2>
                <p className="text-white">
                  All requirements complete. You can now schedule your state board exam.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-brand-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Not Yet Eligible</h2>
                <p className="text-amber-100">
                  Complete the requirements below to unlock exam scheduling.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requirements Checklist */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="font-bold text-black">Exam Eligibility Requirements</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {/* Hours Requirement */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {hoursComplete ? (
                  <span className="text-slate-500 flex-shrink-0">•</span>
                ) : (
                  <Clock className="w-6 h-6 text-amber-500" />
                )}
                <div>
                  <div className="font-semibold text-black">Complete {requiredHours} Hours</div>
                  <div className="text-sm text-slate-500">
                    {totalHours.toFixed(1)} / {requiredHours} hours completed
                  </div>
                </div>
              </div>
              {hoursComplete ? (
                <span className="px-3 py-2 bg-brand-green-100 text-brand-green-700 text-sm font-semibold rounded-full">
                  Complete
                </span>
              ) : (
                <span className="px-3 py-2 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
                  {(requiredHours - totalHours).toFixed(1)} hrs remaining
                </span>
              )}
            </div>

            {/* Milady Theory */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {miladyComplete ? (
                  <span className="text-slate-500 flex-shrink-0">•</span>
                ) : (
                  <Clock className="w-6 h-6 text-amber-500" />
                )}
                <div>
                  <div className="font-semibold text-black">Complete Milady Theory</div>
                  <div className="text-sm text-slate-500">
                    Related Technical Instruction (RTI)
                  </div>
                </div>
              </div>
              {miladyComplete ? (
                <span className="px-3 py-2 bg-brand-green-100 text-brand-green-700 text-sm font-semibold rounded-full">
                  Complete
                </span>
              ) : (
                <Link
                  href="/lms/progress"
                  className="px-3 py-2 bg-brand-blue-100 text-brand-blue-700 text-sm font-semibold rounded-full hover:bg-brand-blue-200"
                >
                  Access Milady →
                </Link>
              )}
            </div>

            {/* Practical Skills (optional indicator) */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {skillsVerified ? (
                  <span className="text-slate-500 flex-shrink-0">•</span>
                ) : (
                  <Clock className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <div className="font-semibold text-black">Practical Skills Verified</div>
                  <div className="text-sm text-slate-500">
                    Mentor verification of hands-on competencies
                  </div>
                </div>
              </div>
              <Link
                href="/apprentice/skills"
                className="px-3 py-2 bg-white text-slate-700 text-sm font-semibold rounded-full hover:bg-slate-200"
              >
                View Skills →
              </Link>
            </div>

            {/* Exam Fee */}
            <div className="p-4 flex items-center justify-between bg-brand-green-50">
              <div className="flex items-center gap-4">
                <span className="text-slate-500 flex-shrink-0">•</span>
                <div>
                  <div className="font-semibold text-black">State Board Exam Fee</div>
                  <div className="text-sm text-slate-500">
                    ${examFee} - Included in your program tuition
                  </div>
                </div>
              </div>
              <span className="px-3 py-2 bg-brand-green-100 text-brand-green-700 text-sm font-semibold rounded-full">
                Paid
              </span>
            </div>
          </div>
        </div>

        {/* Exam Scheduling Section */}
        {isReady ? (
          <div className="bg-white rounded-xl border-2 border-brand-green-200 overflow-hidden">
            <div className="p-4 border-b border-brand-green-200 bg-brand-green-50">
              <h3 className="font-bold text-brand-green-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Your Exam
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* PSI Exam Registration */}
                <a
                  href={examInfo.examProviderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-brand-blue-50 border-2 border-brand-blue-200 rounded-xl hover:border-brand-blue-400 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-brand-blue-900">Schedule Exam</h4>
                    <ExternalLink className="w-5 h-5 text-brand-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-brand-blue-700 mb-3">
                    Register and schedule your written and practical exams through {examInfo.examProvider}.
                  </p>
                  <div className="text-brand-blue-600 font-semibold text-sm flex items-center gap-1">
                    Go to {examInfo.examProvider} <ArrowRight className="w-4 h-4" />
                  </div>
                </a>

                {/* IPLA Application */}
                <a
                  href={examInfo.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-6 bg-brand-blue-50 border-2 border-brand-blue-200 rounded-xl hover:border-brand-blue-400 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-brand-blue-900">License Application</h4>
                    <ExternalLink className="w-5 h-5 text-brand-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-sm text-brand-blue-700 mb-3">
                    Apply for your Indiana license through the IPLA MyLicense portal.
                  </p>
                  <div className="text-brand-blue-600 font-semibold text-sm flex items-center gap-1">
                    Go to MyLicense.IN.gov <ArrowRight className="w-4 h-4" />
                  </div>
                </a>
              </div>

              {/* Exam Info */}
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold text-black mb-3">Exam Information</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Written Exam:</span>
                    <span className="ml-2 text-black">100 questions, 90 minutes</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Practical Exam:</span>
                    <span className="ml-2 text-black">Live demonstration</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Passing Score:</span>
                    <span className="ml-2 text-black">75% on each section</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Exam Fee:</span>
                    <span className="ml-2 text-brand-green-600 font-semibold">Included in tuition</span>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={examInfo.boardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  IPLA Board Info
                </a>
                <a
                  href={examInfo.examUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
                >
                  <FileText className="w-4 h-4" />
                  Exam Requirements
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Exam Scheduling Locked</h3>
            <p className="text-slate-500 mb-4">
              Complete all requirements above to unlock exam scheduling.
            </p>
            <Link
              href="/lms/progress"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700"
            >
              View My Progress <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 mb-2">Important Information</h4>
              <ul className="text-sm text-amber-800 space-y-2">
                <li>• Your exam fee (${examFee}) is included in your program tuition and has been paid.</li>
                <li>• You must bring valid government-issued photo ID to the exam.</li>
                <li>• Bring your own tools/kit for the practical exam (check IPLA requirements).</li>
                <li>• If you fail, retake fees may apply (contact us for assistance).</li>
                <li>• After passing, apply for your license through MyLicense.IN.gov.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <h4 className="font-bold text-black mb-2">Need Help?</h4>
          <p className="text-slate-600 mb-4">
            Questions about the state board exam? We're here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/support"
              className="px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-lg font-medium hover:bg-brand-blue-200"
            >
              Call: 317-314-3757
            </a>
            <a
              href="/contact"
              className="px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-lg font-medium hover:bg-brand-blue-200"
            >
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
