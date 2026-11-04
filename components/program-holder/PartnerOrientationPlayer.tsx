'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import media from '@/lib/program-holder/onboarding-media.json';
export function PartnerOrientationPlayer() {
  const video = useRef<HTMLVideoElement>(null);
  const saved = useRef(0),
    saving = useRef(false),
    lastSent = useRef(0);
  const [loaded, setLoaded] = useState(false),
    [complete, setComplete] = useState(false),
    [signed, setSigned] = useState(false),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/program-holder/orientation', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        if (active) {
          saved.current = Number(data.watch_seconds || 0);
          if (video.current && video.current.readyState >= 1)
            video.current.currentTime = saved.current;
          setComplete(saved.current >= Math.ceil(media.durationSeconds) - 1);
          setSigned(Boolean(data.acknowledgement));
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (active) setMessage(e.message || 'Orientation could not load. Reload to retry.');
      });
    return () => {
      active = false;
    };
  }, []);
  async function progress(force = false) {
    const player = video.current;
    if (
      !loaded ||
      !player ||
      saving.current ||
      player.seeking ||
      (!force && (player.paused || Date.now() - lastSent.current < 8000))
    )
      return;
    const position = player.currentTime;
    if (position <= saved.current && !force) return;
    saving.current = true;
    lastSent.current = Date.now();
    try {
      const r = await fetch('/api/program-holder/orientation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'progress', position }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      saved.current = data.watched;
      setComplete(data.completed);
      setMessage('Playback progress saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Playback could not be saved.');
    } finally {
      saving.current = false;
    }
  }
  async function acknowledge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    try {
      const r = await fetch('/api/program-holder/orientation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge',
          ...Object.fromEntries(fields),
          understood: fields.get('understood') === 'yes',
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setSigned(true);
      setMessage(
        'Your watched-and-understood acknowledgement is saved with the video version and your signature.',
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Your acknowledgement could not be saved.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-2xl border border-blue-200 bg-white p-5">
      <h2 className="text-2xl font-black">Watch PARIS walk you through onboarding</h2>
      <p className="text-sm">
        One continuous visual video, with captions and saved progress. Your agreement signatures
        remain separate.
      </p>
      <video
        ref={video}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-slate-900"
        onLoadedMetadata={() => {
          if (video.current && loaded) video.current.currentTime = saved.current;
        }}
        onPlay={() => {
          if (video.current && video.current.currentTime > saved.current + 2)
            video.current.currentTime = saved.current;
        }}
        onTimeUpdate={() => void progress()}
        onPause={() => void progress(true)}
        onEnded={() => void progress(true)}
        onSeeking={() => {
          if (video.current && video.current.currentTime > saved.current + 2)
            video.current.currentTime = saved.current;
        }}
        onError={() =>
          setMessage(
            'Video could not load. Reload or contact Office Mail; completion has not been recorded.',
          )
        }
      >
        <source src={media.video} type="video/mp4" />
        <track kind="captions" src={media.captions} srcLang="en" label="English" default />
      </video>
      <details className="rounded-xl border p-3">
        <summary className="min-h-11 cursor-pointer font-bold">Audio and transcript</summary>
        <audio controls preload="none" className="w-full" src={media.audio} />
        <p className="my-2 text-sm">
          Audio replay is available for review. Complete the video before signing the video
          acknowledgement.
        </p>
        {media.chapters.map((ch) => (
          <details key={ch.title} className="border-t py-2">
            <summary className="min-h-11 cursor-pointer font-bold">{ch.title}</summary>
            <p className="text-sm leading-6">{ch.script}</p>
          </details>
        ))}
      </details>
      {signed ? (
        <p className="rounded-xl bg-green-50 p-4 font-bold">
          Video acknowledgement recorded. Continue with your individual documents below.
        </p>
      ) : (
        <form onSubmit={acknowledge} className="space-y-3">
          <fieldset disabled={!complete || busy} className="space-y-3">
            <legend className="font-bold">After playback: review and sign</legend>
            <label className="block text-sm">
              Which payment terms control your invoice?
              <select
                name="agreementAnswer"
                required
                className="block min-h-12 w-full rounded-xl border p-2"
              >
                <option value="">Choose</option>
                <option value="individual">
                  My signed individual agreement and student schedule
                </option>
                <option value="everyone">One amount for every partner</option>
              </select>
            </label>
            <label className="block text-sm">
              Where do bank account numbers belong?
              <select
                name="bankAnswer"
                required
                className="block min-h-12 w-full rounded-xl border p-2"
              >
                <option value="">Choose</option>
                <option value="provider">The verified payment provider’s secure setup page</option>
                <option value="email">In an Office Mail message</option>
              </select>
            </label>
            <label className="block text-sm">
              What happens when you submit an invoice?
              <select
                name="paymentAnswer"
                required
                className="block min-h-12 w-full rounded-xl border p-2"
              >
                <option value="">Choose</option>
                <option value="review">Elevate reviews the request and supporting records</option>
                <option value="paid">It automatically pays me</option>
              </select>
            </label>
            <label className="flex min-h-12 gap-3 text-sm">
              <input
                name="understood"
                value="yes"
                type="checkbox"
                required
                className="h-6 w-6 shrink-0"
              />
              I watched this video, understand the responsibilities explained, and had an
              opportunity to ask questions. I will ask Elevate about anything unclear. This
              acknowledgement does not replace my MOU or other signatures.
            </label>
            <label className="block text-sm font-bold">
              Your full name — electronic acknowledgement
              <input
                name="signer"
                required
                minLength={2}
                maxLength={150}
                className="block min-h-12 w-full rounded-xl border p-3"
              />
            </label>
            <button
              disabled={!complete || busy}
              className="min-h-12 rounded-xl bg-blue-800 px-5 font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Sign video acknowledgement'}
            </button>
          </fieldset>
          {!complete && (
            <p className="text-sm">Finish the video to unlock your review and signature.</p>
          )}
        </form>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
