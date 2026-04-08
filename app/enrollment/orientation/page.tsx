'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2, ArrowRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function EnrollmentOrientationPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkEnrollment() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error } = await supabase
        .from('program_enrollments')
        .select('id, enrollment_state')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) { router.push('/programs'); return; }

      if (data.enrollment_state === 'orientation_complete') { router.push('/enrollment/documents'); return; }
      if (data.enrollment_state === 'documents_complete' || data.enrollment_state === 'active') { router.push('/learner/dashboard'); return; }

      setEnrollmentId(data.id);
      setLoading(false);
    }
    checkEnrollment();
  }, [router]);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setVideoProgress(pct);
    if (pct >= 80 && !videoWatched) setVideoWatched(true);
  }

  function handleEnded() {
    setVideoWatched(true);
    setVideoProgress(100);
    setPlaying(false);
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  async function handleComplete() {
    if (!agreed || !videoWatched || !enrollmentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/enrollment/orientation/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete orientation');
      router.push('/enrollment/documents');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 py-6 px-4 text-center">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Enrollment — Step 2 of 3</p>
        <h1 className="text-2xl font-black text-white">Program Orientation</h1>
        <p className="text-white/80 text-sm mt-1">Watch the video, then sign to unlock your program</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">

        {/* Step 1 — Video */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
            <h2 className="font-bold text-black text-sm">Watch the Orientation Video</h2>
            {videoWatched && <CheckCircle2 className="w-5 h-5 text-brand-green-600 ml-auto flex-shrink-0" />}
          </div>

          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              poster="/images/pages/orientation-page-1.jpg"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              playsInline
              preload="metadata"
            >
              <source src="/videos/orientation-full.mp4" type="video/mp4" />
            </video>

            {!playing && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group"
                aria-label="Play orientation video"
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <Play className="w-7 h-7 text-slate-900 ml-1" />
                </div>
              </button>
            )}

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors" aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-brand-blue-400 rounded-full transition-all duration-300" style={{ width: `${videoProgress}%` }} />
              </div>
              <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors" aria-label={muted ? 'Unmute' : 'Mute'}>
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200">
            {videoWatched ? (
              <p className="text-brand-green-700 text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Video complete — sign below to finish orientation
              </p>
            ) : (
              <p className="text-black text-sm">
                Watch at least 80% of the video to unlock the sign-off.
                {videoProgress > 0 && (
                  <span className="ml-2 text-brand-blue-600 font-semibold">{Math.round(videoProgress)}% watched</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Step 2 — Acknowledgment */}
        <div className={`rounded-2xl border overflow-hidden transition-opacity duration-300 ${videoWatched ? 'border-slate-200 opacity-100' : 'border-slate-100 opacity-40 pointer-events-none select-none'}`}>
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">2</span>
            <h2 className="font-bold text-black text-sm">Sign Orientation Acknowledgment</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-black text-sm leading-relaxed">
              By checking the box below, you confirm you have watched the orientation video and agree to the following:
            </p>
            <ul className="space-y-2.5">
              {[
                'Attendance is mandatory. Two consecutive unexcused absences trigger an intervention.',
                'All coursework, quizzes, and assessments require a minimum 70% passing score.',
                'OSHA safety training is required before any hands-on work begins.',
                'Funding covers tuition, books, supplies, and certification exam fees for eligible students.',
                'Career services are available throughout and after your program at no cost.',
                'Professional conduct is required at all times — in class, online, and at employer sites.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-black">
                  <CheckCircle2 className="w-4 h-4 text-brand-blue-600 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <label className="flex items-start gap-3 cursor-pointer mt-2 p-4 rounded-xl border-2 border-slate-200 hover:border-brand-blue-400 transition-colors">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
              />
              <span className="text-black text-sm font-medium">
                I have watched the orientation video and agree to all program policies, attendance requirements, and safety protocols listed above.
              </span>
            </label>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleComplete}
          disabled={!agreed || !videoWatched || submitting}
          className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-base transition-colors ${
            agreed && videoWatched && !submitting
              ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Saving...</>
          ) : (
            <>Complete Orientation <ArrowRight className="w-5 h-5" /></>
          )}
        </button>

        <p className="text-center text-black text-xs">
          Questions? Call{' '}
          <a href="tel:3173143757" className="text-brand-blue-600 font-semibold hover:underline">
            (317) 314-3757
          </a>
        </p>
      </div>
    </div>
  );
}
