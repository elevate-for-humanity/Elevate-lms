import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Video, Calendar, Clock, CheckCircle, ExternalLink, AlertCircle, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Interview | Elevate For Humanity',
  robots: { index: false, follow: false },
};

async function createZoomMeeting(topic: string, startTime: string): Promise<string | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const userId = process.env.ZOOM_USER_ID || 'me';

  if (!accountId || !clientId || !clientSecret) return null;

  try {
    // Get OAuth token
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    if (!tokenRes.ok) return null;
    const { access_token } = await tokenRes.json();

    // Create meeting
    const meetingRes = await fetch(`https://api.zoom.us/v2/users/${userId}/meetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        type: 2, // scheduled
        start_time: startTime,
        duration: 45,
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          auto_recording: 'cloud',
        },
      }),
    });
    if (!meetingRes.ok) return null;
    const meeting = await meetingRes.json();
    return meeting.join_url ?? null;
  } catch {
    return null;
  }
}

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/careers/interview/${id}`);

  // Load application
  const { data: app } = await db
    .from('job_applications')
    .select('*, job_postings(title, department)')
    .eq('id', id)
    .maybeSingle();

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Interview Not Found</h1>
          <p className="text-slate-500 mb-4">This interview link may have expired or is invalid.</p>
          <Link href="/careers" className="text-brand-blue-600 hover:underline">Back to Careers</Link>
        </div>
      </div>
    );
  }

  // Check if interview already scheduled in DB
  const { data: existingInterview } = await db
    .from('interviews')
    .select('*')
    .eq('candidate', id)
    .maybeSingle();

  let zoomLink = existingInterview?.profiles?.zoom_link ?? null;
  let interviewDate = existingInterview?.scheduled_at ?? null;

  // If no interview scheduled yet and Zoom is configured, create one for 2 business days out
  if (!zoomLink && !interviewDate) {
    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + 2);
    // Skip weekends
    if (scheduledAt.getDay() === 0) scheduledAt.setDate(scheduledAt.getDate() + 1);
    if (scheduledAt.getDay() === 6) scheduledAt.setDate(scheduledAt.getDate() + 2);
    scheduledAt.setHours(10, 0, 0, 0);

    const position = app.job_postings?.title ?? 'Staff Position';
    zoomLink = await createZoomMeeting(
      `Interview: ${position} — Elevate for Humanity`,
      scheduledAt.toISOString()
    );

    if (zoomLink) {
      interviewDate = scheduledAt.toISOString();
      // Save to interviews table
      await db.from('interviews').insert({
        candidate: id,
        position,
        status: 'scheduled',
        scheduled_at: interviewDate,
        interview_type: 'video',
        profiles: { zoom_link: zoomLink },
      });
      // Update application status
      await db.from('job_applications').update({
        status: 'interview_scheduled',
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    }
  }

  const position = app.job_postings?.title ?? 'Staff Position';
  const formattedDate = interviewDate
    ? new Date(interviewDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const formattedTime = interviewDate
    ? new Date(interviewDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Careers', href: '/careers' }, { label: 'Interview' }]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-brand-blue-600 rounded-2xl flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Video Interview</h1>
              <p className="text-slate-400">{position} · Elevate for Humanity</p>
            </div>
          </div>
          {app.status === 'interview_scheduled' || zoomLink ? (
            <div className="inline-flex items-center gap-2 bg-brand-green-600/20 border border-brand-green-500/30 text-brand-green-300 px-4 py-2 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" /> Interview Scheduled
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 text-amber-300 px-4 py-2 rounded-full text-sm">
              <Clock className="w-4 h-4" /> Pending Scheduling
            </div>
          )}
        </div>

        {zoomLink ? (
          /* ── Zoom link available ── */
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-6">
              <h2 className="font-bold text-slate-900 mb-4">Interview Details</h2>
              <div className="space-y-3">
                {formattedDate && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Date</p>
                      <p className="font-semibold text-slate-900">{formattedDate}</p>
                    </div>
                  </div>
                )}
                {formattedTime && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Time</p>
                      <p className="font-semibold text-slate-900">{formattedTime}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Format</p>
                    <p className="font-semibold text-slate-900">Zoom Video Interview (45 minutes)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brand-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Interviewer</p>
                    <p className="font-semibold text-slate-900">Elevate for Humanity HR Team</p>
                  </div>
                </div>
              </div>
            </div>

            <a href={zoomLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-brand-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-brand-blue-700 transition text-lg">
              <Video className="w-6 h-6" />
              Join Zoom Interview
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">Before your interview:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Test your camera and microphone 10 minutes early</li>
                <li>• Find a quiet, well-lit location</li>
                <li>• Have your resume and any questions ready</li>
                <li>• The waiting room will be open 5 minutes before start time</li>
              </ul>
            </div>
          </div>
        ) : (
          /* ── Zoom not configured — show scheduling info ── */
          <div className="bg-white rounded-2xl border p-8 text-center">
            <Calendar className="w-12 h-12 text-brand-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Interview Being Scheduled</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Our HR team is reviewing your assessment results and will send you a Zoom link within 2 business days.
              Watch your email at <strong>{user.email}</strong>.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 mb-6">
              <p className="font-semibold mb-1">What to expect:</p>
              <p>A 45-minute video interview covering your experience, situational judgment, and alignment with our mission. The interview is conversational — not a test.</p>
            </div>
            <Link href="/careers"
              className="inline-flex items-center gap-2 text-brand-blue-600 hover:underline font-medium">
              Back to Careers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
