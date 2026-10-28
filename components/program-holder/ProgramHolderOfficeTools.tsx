'use client';
import { VideoCallingGuide } from '@/components/communications/VideoCallingGuide';
import { MeetingDeviceCheck } from './MeetingDeviceCheck';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarWidget } from '@/components/CalendarWidget';
import Link from 'next/link';
import { CalendarDays, Video } from 'lucide-react';

export function ProgramHolderOfficeTools({ mode }: { mode: 'meetings' | 'mail' }) {
  const endpoint =
    mode === 'meetings' ? '/api/program-holder/meetings' : '/api/program-holder/office-mail';
  const [data, setData] = useState<any>({
    meetings: [],
    messages: [],
    applicants: [],
    recipients: [],
    videoReady: false,
  });
  const [status, setStatus] = useState('');
  const [preview, setPreview] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      const result = await response.json();
      if (response.status === 403 && result.error === 'Program Holder session required.') {
        setPreview(true);
        setStatus(
          `Administrator preview is read only. Sign in as this Program Holder to use ${mode === 'meetings' ? 'meetings' : 'office mail'}.`,
        );
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Unable to load the workspace.');
      setPreview(false);
      setData(result);
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load the workspace.');
    } finally {
      setLoaded(true);
    }
  }, [endpoint, mode]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Saving…');
    const form = new FormData(event.currentTarget);
    const formElement = event.currentTarget;
    try {
    const body =
      mode === 'meetings'
        ? {
            programHolderStudentId: form.get('student'),
            title: form.get('title'),
            startsAt: (() => {
              const value = String(form.get('startsAt') || '');
              const date = new Date(value);
              if (!value || Number.isNaN(date.getTime())) {
                throw new Error('Enter a valid meeting date and time.');
              }
              return date.toISOString();
            })(),
            meetingMethod: form.get('method'),
            durationMinutes: Number(form.get('duration') || 30),
            location: form.get('location'),
            agenda: form.get('agenda'),
          }
        : {
            recipientId: form.get('recipient'),
            subject: form.get('subject'),
            message: form.get('message'),
          };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Your session could not be verified. Sign in again before retrying.');
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to save.');
      formElement.reset();
      await load();
      setStatus(
        mode !== 'meetings'
          ? 'Office message sent.'
          : result.invitationDelivery === 'accepted'
            ? 'Meeting scheduled. Student invitation accepted for email delivery.'
            : result.invitationDelivery === 'missing_email'
              ? 'Meeting scheduled, but no student account email is available for the invitation.'
              : 'Meeting scheduled, but the invitation email was not sent. Contact the student before the meeting.',
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save. Please retry.');
    }
  }

  if (mode === 'meetings') {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        <header><h1 className="text-2xl font-black text-slate-950">Calendar and meetings</h1><p className="mt-2 text-sm text-slate-600">Schedule, confirm and join your appointments here.</p></header>
        <VideoCallingGuide />
        <MeetingDeviceCheck />

        {loaded && !preview && !data.videoReady && !status ? (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <p className="font-black">Secure video connection is not active yet</p>
            <p className="mt-1 text-sm">
              Phone and in-person scheduling remain available. Ask Elevate to activate the meeting
              service before promising a video or screen share.
            </p>
          </section>
        ) : null}
        {status && (
          <p role="status" className="rounded-xl border bg-white p-3 text-sm font-bold">
            {status}
          </p>
        )}

        {loaded ? (
          <section aria-label="Meeting calendar">
            <h2 className="mb-3 text-xl font-black">Your calendar</h2>
            {data.userId && !preview ? <CalendarWidget
              userId={data.userId}
              additionalEvents={(data.meetings || [])
                .filter((meeting: any) => meeting.status === 'scheduled')
                .map((meeting: any) => ({
                  id: meeting.id,
                  title: meeting.title,
                  date: meeting.starts_at.slice(0, 10),
                  startsAt: meeting.starts_at,
                  type: 'event' as const,
                }))}
            /> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Sign in as the assigned Program Holder to load your private calendar. Your meeting dates are not displayed in administrator preview.</div>}
          </section>
        ) : null}
        {data.contactAccessGranted === false ? (
          <p className="rounded-xl border bg-blue-50 p-4 text-sm">
            Student contact details require signed agreements.{' '}
            <Link className="font-bold underline" href="/program-holder/documents">
              Review agreements
            </Link>
          </p>
        ) : (
          <details className="rounded-xl border bg-white p-5">
            <summary className="cursor-pointer font-black">Student contact directory</summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.applicants?.map((student: any) => (
                <article key={student.id} className="rounded-xl border p-3">
                  <p className="font-bold">{student.applicant_name}</p>
                  {!student.user_id ? (
                    <p className="text-xs text-amber-800">
                      Student Portal account not yet linked; use email or phone.
                    </p>
                  ) : null}
                  {student.applicant_email ? (
                    <Link
                      className="block break-all text-blue-700 underline"
                      href={`/communications/email?to=${encodeURIComponent(student.applicant_email)}`}
                    >
                      {student.applicant_email}
                    </Link>
                  ) : (
                    <p>No email on file</p>
                  )}
                  {student.applicant_phone ? (
                    <a
                      className="block text-blue-700 underline"
                      href={`tel:${student.applicant_phone.replace(/[^+0-9]/g, '')}`}
                    >
                      {student.applicant_phone}
                    </a>
                  ) : (
                    <p>No phone on file</p>
                  )}
                </article>
              ))}
            </div>
          </details>
        )}
        <form
          onSubmit={submit}
          aria-disabled={preview}
          className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Schedule</p>
            <h2 className="mt-1 text-xl font-black">Create a meeting</h2>
          </div>
          <select
            name="student"
            aria-label="Student"
            required
            className="min-h-11 rounded-xl border px-3"
          >
            <option value="">Choose student</option>
            {data.applicants?.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.applicant_name} · {item.applicant_email || 'No email on file'}
              </option>
            ))}
          </select>
          <input
            name="title"
            maxLength={180}
            placeholder="Meeting title (optional)"
            className="min-h-11 rounded-xl border px-3"
          />
          <input
            name="startsAt"
            aria-label="Meeting date and time in your local timezone"
            type="datetime-local"
            required
            className="min-h-11 rounded-xl border px-3"
          />
          <select
            name="duration"
            aria-label="Duration"
            defaultValue="30"
            className="min-h-11 rounded-xl border px-3"
          >
            {[15, 30, 45, 60, 90].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
          <select
            name="method"
            aria-label="Meeting method"
            required
            defaultValue={data.videoReady ? 'video' : 'phone'}
            className="min-h-11 rounded-xl border px-3"
          >
            <option value="video" disabled={!data.videoReady}>
              Dashboard video + screen share
            </option>
            <option value="phone">Phone</option>
            <option value="in_person">In person</option>
          </select>
          <input
            name="location"
            placeholder="Location for in-person meeting (optional)"
            className="min-h-11 rounded-xl border px-3"
          />
          <textarea
            name="agenda"
            maxLength={2000}
            placeholder="Meeting agenda and preparation notes"
            className="rounded-xl border p-3 sm:col-span-2"
          />
          <button
            disabled={preview || !loaded}
            className="min-h-11 rounded-xl bg-indigo-700 px-4 font-black text-white disabled:opacity-50"
          >
            Schedule meeting
          </button>
          <p role="status" className="self-center text-sm font-bold">
            {status}
          </p>
        </form>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-700" />
            <h2 className="text-xl font-black">Upcoming and recent meetings</h2>
          </div>
          {data.meetings?.length ? (
            data.meetings.map((meeting: any) => (
              <article key={meeting.id} className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{meeting.title}</p>
                    <p className="text-sm text-slate-600">
                      {new Date(meeting.starts_at).toLocaleString()} ·{' '}
                      {meeting.meeting_method.replace('_', ' ')} · {meeting.duration_minutes}{' '}
                      minutes
                    </p>
                    {meeting.agenda ? <p className="mt-2 text-sm">{meeting.agenda}</p> : null}
                  </div>
                  {meeting.communication_room_id && meeting.status === 'scheduled' ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-xl border px-4 text-sm font-bold"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            `${window.location.origin}/lms/meetings/${meeting.communication_room_id}`,
                          );
                          setStatus(
                            'Student meeting link copied. Send it using interoffice email.',
                          );
                        } catch {
                          setStatus(
                            'Link could not be copied. Open interoffice email to send the student invitation.',
                          );
                        }
                      }}
                    >
                      Copy student link
                    </button>
                  ) : null}
                  {meeting.communication_room_id && meeting.status === 'scheduled' ? (
                    <Link
                      className="min-h-11 rounded-xl border px-4 py-2 text-sm font-bold"
                      href={`/communications/email?to=${encodeURIComponent(data.applicants?.find((student: any) => student.id === meeting.program_holder_student_id)?.applicant_email || '')}&subject=${encodeURIComponent(`Meeting: ${meeting.title}`)}`}
                    >
                      Email student
                    </Link>
                  ) : null}
                  {meeting.communication_room_id && meeting.status === 'scheduled' ? (
                    <Link
                      href={`/program-holder/meetings/${meeting.communication_room_id}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 font-black text-white"
                    >
                      <Video className="h-4 w-4" /> Join room
                    </Link>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl bg-slate-50 p-5 text-slate-600">No meetings scheduled yet.</p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">
          Private workspace
        </p>
        <h1 className="text-3xl font-black">Inter-office mail</h1>
        <p className="mt-2 text-slate-600">
          Send private, auditable messages to your assigned students and Elevate administrators.
        </p>
      </header>
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm">
        <select name="recipient" required className="min-h-11 rounded-xl border px-3">
          <option value="">Choose student or administrator</option>
          {data.recipients?.map((item: any) => (
            <option key={item.id} value={item.id}>
              {item.full_name || item.role} · {item.role}
            </option>
          ))}
        </select>
        <input
          name="subject"
          required
          maxLength={180}
          placeholder="Subject"
          className="min-h-11 rounded-xl border px-3"
        />
        <textarea
          name="message"
          required
          maxLength={5000}
          rows={6}
          placeholder="Write your message"
          className="rounded-xl border p-3"
        />
        <button className="min-h-11 rounded-xl bg-blue-700 px-4 font-black text-white">
          Send office message
        </button>
        <p role="status" className="text-sm font-bold">
          {status}
        </p>
      </form>
      <section className="grid gap-3">
        {data.messages?.map((message: any) => (
          <article key={message.id} className="rounded-xl border bg-white p-4">
            <p className="font-black">{message.subject}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{message.body}</p>
            <p className="mt-2 text-xs text-slate-500">
              {new Date(message.created_at).toLocaleString()}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
