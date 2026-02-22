export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, ArrowRight, Shield } from 'lucide-react';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = 'info@elevateforhumanity.org';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export const metadata: Metadata = {
  title: 'Enrollment Status | Elevate for Humanity',
};

interface VerificationResult {
  requirement: string;
  status: string;
  verified: boolean;
}

export default async function ApprovedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/student-portal/onboarding/approved');

  // Call the verification function to get real-time checklist
  let checklist: VerificationResult[] = [];
  let allPassed = false;

  try {
    const { data, error } = await supabase.rpc('verify_enrollment_complete', {
      p_user_id: user.id,
    });
    if (!error && data) {
      checklist = data as VerificationResult[];
      const summary = checklist.find((r) => r.requirement === 'ALL REQUIREMENTS MET');
      allPassed = summary?.verified ?? false;
      // Remove the summary row from display
      checklist = checklist.filter((r) => r.requirement !== 'ALL REQUIREMENTS MET');
    }
  } catch {
    // Function may not exist yet — show fallback
  }

  if (!allPassed) {
    redirect('/student-portal/onboarding');
  }

  // Send approval emails (idempotent — only sends once)
  try {
    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (progress?.status !== 'approval_emailed') {
      // Get application details for the email
      const { data: app } = await supabase
        .from('applications')
        .select('first_name, last_name, email, program_interest')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (app) {
        const programLabel = (app.program_interest || 'your program').replace(/-/g, ' ');

        // Student approval email
        await sendEmail({
          to: app.email,
          subject: `Enrollment Approved — Welcome to ${programLabel}`,
          html: [
            `<h2>Congratulations, ${app.first_name}!</h2>`,
            `<p>Your enrollment for <strong>${programLabel}</strong> at Elevate for Humanity has been <strong>approved</strong>.</p>`,
            `<p>All requirements have been verified:</p>`,
            `<ul>`,
            ...checklist.map((c) => `<li>${c.verified ? '✅' : '❌'} ${c.requirement}</li>`),
            `</ul>`,
            `<h3>What Happens Next</h3>`,
            `<ol>`,
            `<li>Access your course materials: <a href="${SITE_URL}/lms/dashboard">${SITE_URL}/lms/dashboard</a></li>`,
            `<li>Your instructor will contact you with your class schedule</li>`,
            `<li>If you applied for WIOA funding, we will coordinate with WorkOne on your behalf</li>`,
            `</ol>`,
            `<p>Questions? Reply to this email or call us.</p>`,
            `<p>— Elevate for Humanity</p>`,
          ].join(''),
        }).catch((err) => logger.error('Student approval email failed', err as Error));

        // Admin notification
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `[APPROVED] ${app.first_name} ${app.last_name} — ${programLabel}`,
          html: [
            `<h3>Student Enrollment Approved — All Requirements Verified</h3>`,
            `<table style="border-collapse:collapse;width:100%;max-width:500px">`,
            `<tr><td style="padding:6px;font-weight:bold">Name</td><td>${app.first_name} ${app.last_name}</td></tr>`,
            `<tr><td style="padding:6px;font-weight:bold">Email</td><td><a href="mailto:${app.email}">${app.email}</a></td></tr>`,
            `<tr><td style="padding:6px;font-weight:bold">Program</td><td>${programLabel}</td></tr>`,
            `</table>`,
            `<h4>Verification Checklist</h4>`,
            `<ul>`,
            ...checklist.map((c) => `<li>${c.verified ? '✅' : '❌'} ${c.requirement} — ${c.status}</li>`),
            `</ul>`,
            `<p><a href="${SITE_URL}/admin/applications">View in Admin Dashboard</a></p>`,
          ].join(''),
        }).catch((err) => logger.error('Admin approval email failed', err as Error));

        // Mark as emailed
        await supabase
          .from('onboarding_progress')
          .update({ status: 'approval_emailed' })
          .eq('user_id', user.id);
      }
    }
  } catch (emailErr) {
    logger.error('Approval email flow error', emailErr as Error);
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Enrollment Approved
          </h1>
          <p className="text-lg text-slate-600">
            All requirements verified. You are now enrolled in your program.
          </p>
        </div>

        {/* Verification Checklist */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 bg-slate-900">
            <h2 className="text-white font-bold">Verification Checklist</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                {item.verified ? (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}
                <span className="flex-1 text-sm text-slate-800">{item.requirement}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  item.verified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="font-bold text-slate-900 mb-3">What Happens Next</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              Your program enrollment is now active
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              You can access your course materials in the LMS
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              Your instructor will contact you with your class schedule
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              If you applied for WIOA funding, we will coordinate with WorkOne on your behalf
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/lms/dashboard"
            className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-4 rounded-lg transition-colors"
          >
            Go to Your Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
