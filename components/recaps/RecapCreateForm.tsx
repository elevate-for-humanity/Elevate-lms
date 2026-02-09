"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';

import { useMemo, useState } from 'react';

export default function RecapCreateForm() {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultLink, setResultLink] = useState<string | null>(null);
  const supabase = createClient();
  const canSubmit = useMemo(
    () => title.trim() && transcript.trim(),
    [title, transcript]
  );

  // Log recap generation to DB
  const logRecapGeneration = async (status: 'started' | 'completed' | 'failed', recapId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('recap_generation_log')
      .insert({
        user_id: user?.id,
        title,
        meeting_date: meetingDate || null,
        status,
        recap_id: recapId,
        transcript_length: transcript.length,
        generated_at: new Date().toISOString()
      });
  };

  async function onSubmit() {
    setLoading(true);
    setResultLink(null);
    await logRecapGeneration('started');

    const res = await fetch('/api/recaps/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        meeting_date: meetingDate || undefined,
        attendee_email: attendeeEmail || undefined,
        transcript,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      await logRecapGeneration('failed');
      alert(json?.error || 'Failed to generate recap');
      return;
    }
    setResultLink(`/dashboard/recaps/${json.recap_id}`);
    setTranscript('');
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Generate a recap</h2>
        {loading ? (
          <span className="text-xs text-neutral-500">Generating…</span>
        ) : null}
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">Title</span>
          <input
            className="h-10 rounded-xl border px-3 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="EFH + Partner onboarding call"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-neutral-700">
              Meeting date (optional)
            </span>
            <input
              type="datetime-local"
              className="h-10 rounded-xl border px-3 text-sm"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-neutral-700">
              Attendee email (optional)
            </span>
            <input
              className="h-10 rounded-xl border px-3 text-sm"
              value={attendeeEmail}
              onChange={(e) => setAttendeeEmail(e.target.value)}
              placeholder="your.email@gmail.com"
            />
          </label>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-medium text-neutral-700">
            Transcript / notes
          </span>
          <textarea
            className="min-h-[220px] rounded-xl border p-3 text-sm leading-relaxed"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste call notes or transcript here…"
          />
        </label>

        <button
          disabled={!canSubmit || loading}
          onClick={onSubmit}
          className="h-11 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-40"
        >
          Create recap
        </button>

        {resultLink ? (
          <a className="text-sm font-semibold underline" href={resultLink}>
            Open your recap →
          </a>
        ) : null}

        <p className="text-xs text-neutral-500">
          Tip: If you use Zoom/Teams/Meet, you can paste the transcript here
          until we wire direct integrations.
        </p>
      </div>
    </div>
  );
}
