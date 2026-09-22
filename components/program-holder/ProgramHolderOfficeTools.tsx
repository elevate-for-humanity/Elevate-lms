'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MessageSquare, MonitorUp, Video } from 'lucide-react';

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

  const load = useCallback(async () => {
    const response = await fetch(endpoint, { cache: 'no-store' });
    setData(await response.json());
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Saving…');
    const form = new FormData(event.currentTarget);
    const body =
      mode === 'meetings'
        ? {
            programHolderStudentId: form.get('student'),
            title: form.get('title'),
            startsAt: form.get('startsAt'),
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setStatus(
      response.ok
        ? mode === 'meetings'
          ? 'Meeting scheduled.'
          : 'Office message sent.'
        : result.error || 'Unable to save.',
    );
    if (response.ok) {
      event.currentTarget.reset();
      await load();
    }
  }

  if (mode === 'meetings') {
    return (
      <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        <section className="relative min-h-[300px] overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
          <Image
            src="/images/pages/business-meeting.webp"
            alt="Team members collaborating in a video meeting"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950/95 to-indigo-900/45" />
          <div className="relative max-w-3xl p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Video · Screen share · Dashboard chat
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Meet inside your Elevate PWA</h1>
            <p className="mt-4 text-base leading-7 text-slate-100">
              Create secure browser video rooms without sending staff to a separate meeting app.
              Camera, microphone, participant chat, and screen sharing are available in the room.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm font-black">
              <span className="rounded-full bg-white/15 px-3 py-2">Camera and microphone</span>
              <span className="rounded-full bg-white/15 px-3 py-2">Share tab or screen</span>
              <span className="rounded-full bg-white/15 px-3 py-2">Up to 20 participants</span>
            </div>
          </div>
        </section>

        {!data.videoReady ? (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <p className="font-black">Secure video connection is not active yet</p>
            <p className="mt-1 text-sm">
              Phone and in-person scheduling remain available. Video creation will unlock only after
              the meeting service passes its connection test.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            [Video, 'Dashboard video', 'See and hear participants without leaving the PWA.'],
            [MonitorUp, 'Screen sharing', 'Present a browser tab, application, or entire screen.'],
            [MessageSquare, 'Room chat', 'Keep live meeting notes and links beside the video.'],
          ].map(([Icon, title, body]: any) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <Icon className="h-6 w-6 text-indigo-700" />
              <h2 className="mt-3 font-black">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </section>

        <form
          onSubmit={submit}
          className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Schedule</p>
            <h2 className="mt-1 text-xl font-black">Create a meeting</h2>
          </div>
          <select name="student" required className="min-h-11 rounded-xl border px-3">
            <option value="">Choose applicant</option>
            {data.applicants?.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.applicant_name}
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
            type="datetime-local"
            required
            className="min-h-11 rounded-xl border px-3"
          />
          <select name="duration" defaultValue="30" className="min-h-11 rounded-xl border px-3">
            {[15, 30, 45, 60, 90].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
          <select
            name="method"
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
          <button className="min-h-11 rounded-xl bg-indigo-700 px-4 font-black text-white">
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
                  {meeting.communication_room_id ? (
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
          Send private, auditable messages to Elevate staff and administrators.
        </p>
      </header>
      <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-white p-5 shadow-sm">
        <select name="recipient" required className="min-h-11 rounded-xl border px-3">
          <option value="">Choose recipient</option>
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
