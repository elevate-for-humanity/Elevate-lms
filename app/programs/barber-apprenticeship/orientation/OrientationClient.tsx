'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, Play, DollarSign, Clock, AlertTriangle,
  Shield, MapPin, BookOpen, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { formatCurrency } from '@/lms-data/orientationConfig';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export interface BarberPaymentSummary {
  downPayment: number;
  remainingBalance: number;
  weeklyPaymentCents: number;
  weeksRemaining: number;
  fullyPaid: boolean;
}

// ── Handbook slides ───────────────────────────────────────────────────────────

const HANDBOOK_SLIDES = [
  {
    id: 'program-overview',
    icon: Shield,
    title: 'Your Apprenticeship',
    content: [
      'This is a U.S. Department of Labor Registered Apprenticeship — a nationally recognized credential.',
      'You must complete 2,000 apprenticeship hours total: 1,500 on-the-job training (OJT) hours at your host barbershop and 500 related technical instruction (RTI) hours via Elevate LMS online coursework.',
      'Upon completion you are eligible to sit for the Indiana Barber License exam.',
      'Your host shop supervisor signs off on your hours weekly. Hours not signed off do not count.',
    ],
  },
  {
    id: 'clock-in-out',
    icon: Clock,
    title: 'Clocking In & Out',
    content: [
      'You must clock in when you arrive at your host shop and clock out when you leave — every single shift.',
      'Clocking in requires GPS verification. You must be physically present at the shop address on file.',
      'If you leave the shop during your shift, the system will automatically clock you out. You must clock back in when you return.',
      'Forgetting to clock in means those hours are lost. There is no retroactive hour entry — contact your advisor immediately if this happens.',
      'Lunch breaks are logged separately. Clock out for lunch, clock back in when you return.',
    ],
  },
  {
    id: 'auto-clockout',
    icon: MapPin,
    title: 'Auto Clock-Out',
    content: [
      'The system sends a heartbeat every few minutes while you are clocked in.',
      'If the heartbeat detects you have left the shop\'s GPS boundary, it will automatically clock you out.',
      'You will receive a notification when this happens. Hours up to the point you left are saved.',
      'Do not attempt to spoof your location. GPS fraud is a violation of your apprenticeship agreement and may result in immediate termination.',
      'If you believe an auto clock-out was an error, contact your advisor within 24 hours with an explanation.',
    ],
  },
  {
    id: 'lms',
    icon: BookOpen,
    title: 'Elevate LMS Coursework',
    content: [
      'Your Elevate LMS access will be active immediately after completing this orientation.',
      'Log in at elevateforhumanity.org/lms/courses using your student account.',
      'Elevate LMS coursework counts toward your 2,000 hour total. You must complete all assigned modules.',
      'Do not share your login. Your account is tied to your enrollment record.',
      'LMS progress is reviewed monthly. Falling behind on coursework may affect your program standing.',
    ],
  },
  {
    id: 'payment-terms',
    icon: DollarSign,
    title: 'Payment & Auto-Draft',
    content: [
      'Your weekly payment drafts automatically from the card you used at checkout — every Friday at 10:00 AM ET.',
      'No action is required from you. Payments are fully automatic until your balance is paid in full.',
      'If a payment fails, you will receive an immediate email with a link to update your card.',
      'Program access is suspended if a failed payment is not resolved within 7 days.',
      'Suspended students cannot log hours or access coursework. Suspended hours do not count toward your total.',
      'Enrollment may be terminated after 7 days of non-payment. Amounts already paid are non-refundable.',
      'Call (317) 314-3757 before a payment fails — we can work with you proactively.',
    ],
  },
  {
    id: 'conduct',
    icon: AlertTriangle,
    title: 'Conduct & Termination',
    content: [
      'You represent Elevate for Humanity at your host shop. Professional conduct is required at all times.',
      'Violations that may result in immediate termination: GPS fraud, harassment, theft, or falsifying hours.',
      'Your host shop may request your removal at any time. Elevate will attempt to place you at another shop, but this is not guaranteed.',
      'If you voluntarily leave the program, amounts already paid are non-refundable.',
      'Questions about your standing? Contact your advisor before taking any action.',
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function BarberOrientationClient({ payment }: { payment: BarberPaymentSummary }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoProgress, setVideoProgress] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [readSlides, setReadSlides] = useState<Set<number>>(new Set());
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const weeklyDollars = payment.weeklyPaymentCents / 100;
  const allSlidesRead = readSlides.size >= HANDBOOK_SLIDES.length;
  const currentSlide = HANDBOOK_SLIDES[slideIndex];

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setVideoProgress(pct);
    if (pct >= 80) setVideoWatched(true);
  }

  function markSlideRead(index: number) {
    setReadSlides(prev => new Set([...prev, index]));
  }

  function goToSlide(index: number) {
    markSlideRead(slideIndex);
    setSlideIndex(index);
  }

  async function handleComplete() {
    if (!acknowledged) return;
    setSubmitting(true);
    try {
      await fetch('/api/enrollment/complete-orientation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program: 'barber-apprenticeship' }),
      });
    } catch { /* non-fatal */ }
    router.push('/programs/barber-apprenticeship/documents');
  }

  return (
    <div className="min-h-screen bg-slate-900">

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-black text-xs uppercase tracking-widest mb-0.5">Barber Apprenticeship</p>
            <h1 className="text-white font-bold text-lg">Program Orientation</h1>
          </div>
          <div className="flex items-center gap-4 text-black text-sm">
            <span className={videoWatched ? 'text-emerald-400' : ''}>
              {videoWatched ? '✓ Video' : '① Video'}
            </span>
            <span className={allSlidesRead ? 'text-emerald-400' : videoWatched ? 'text-white' : ''}>
              {allSlidesRead ? '✓ Handbook' : '② Handbook'}
            </span>
            <span className={acknowledged ? 'text-emerald-400' : allSlidesRead ? 'text-white' : ''}>
              {acknowledged ? '✓ Confirm' : '③ Confirm'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* ── Step 1: Video ── */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Step 1 — Watch the Orientation Video
          </h2>
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl">
            <video
              ref={videoRef}
              src="/videos/barber-training.mp4"
              poster="/images/pages/barber-apprentice-learning.jpg"
              controls
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setVideoWatched(true)}
              className="w-full h-full object-cover"
            />
            {videoProgress === 0 && (
              <button
                onClick={() => videoRef.current?.play()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 hover:bg-black/40 transition group"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
                <span className="text-white font-semibold text-sm">Watch your orientation video</span>
                <span className="text-white text-xs">Covers: program overview · clocking in/out · LMS coursework · payment terms</span>
              </button>
            )}
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
            <p className="text-black text-xs text-right">
              {videoWatched
                ? '✓ Video complete — continue to handbook below'
                : `Watch at least 80% to unlock the handbook (${Math.round(videoProgress)}%)`}
            </p>
          </div>
        </div>

        {/* ── Step 2: Handbook slides ── */}
        <div className={`space-y-4 transition-opacity duration-300 ${videoWatched ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Step 2 — Student Handbook ({readSlides.size}/{HANDBOOK_SLIDES.length} sections read)
          </h2>

          {/* Slide nav tabs */}
          <div className="flex gap-2 flex-wrap">
            {HANDBOOK_SLIDES.map((slide, i) => {
              const Icon = slide.icon;
              const isRead = readSlides.has(i);
              const isCurrent = slideIndex === i;
              return (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isCurrent
                      ? 'bg-brand-blue-600 text-white'
                      : isRead
                        ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50'
                        : 'bg-slate-800 text-black hover:text-white'
                  }`}
                >
                  {isRead && !isCurrent ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  {slide.title}
                </button>
              );
            })}
          </div>

          {/* Current slide */}
          <div className="bg-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              {(() => { const Icon = currentSlide.icon; return <Icon className="w-5 h-5 text-brand-blue-400 flex-shrink-0" />; })()}
              <h3 className="text-white font-bold text-base">{currentSlide.title}</h3>
            </div>
            <ul className="space-y-3">
              {currentSlide.content.map((line, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-400 flex-shrink-0 mt-2" />
                  <span className="text-white text-sm leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>

            {/* Payment slide — show real student amounts */}
            {currentSlide.id === 'payment-terms' && (
              <div className="bg-slate-700/50 rounded-xl divide-y divide-slate-600 mt-4">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-black text-sm">Program Total</span>
                  <span className="text-white font-semibold text-sm">{formatCurrency(BARBER_PRICING.fullPrice)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-black text-sm">Your Down Payment</span>
                  <span className="text-white font-semibold text-sm">{formatCurrency(payment.downPayment)}</span>
                </div>
                {!payment.fullyPaid ? (
                  <>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-black text-sm">Remaining Balance</span>
                      <span className="text-white font-semibold text-sm">{formatCurrency(payment.remainingBalance)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-black text-sm">Weekly Auto-Draft</span>
                      <span className="text-brand-blue-400 font-bold text-sm">{formatCurrency(weeklyDollars)} every Friday</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-black text-sm">Weeks Remaining</span>
                      <span className="text-white font-semibold text-sm">{payment.weeksRemaining} weeks</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between px-4 py-2.5">
                    <span className="text-black text-sm">Status</span>
                    <span className="text-emerald-400 font-semibold text-sm">Paid in full</span>
                  </div>
                )}
              </div>
            )}

            {/* Slide navigation */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => goToSlide(Math.max(0, slideIndex - 1))}
                disabled={slideIndex === 0}
                className="flex items-center gap-1 text-black hover:text-white text-sm disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {slideIndex < HANDBOOK_SLIDES.length - 1 ? (
                <button
                  onClick={() => goToSlide(slideIndex + 1)}
                  className="flex items-center gap-1 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => markSlideRead(slideIndex)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Step 3: Acknowledge & Continue ── */}
        <div className={`bg-slate-800 rounded-2xl p-6 space-y-4 transition-opacity duration-300 ${allSlidesRead ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
          <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
            Step 3 — Acknowledge & Continue
          </h2>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={e => setAcknowledged(e.target.checked)}
              disabled={!allSlidesRead}
              className="w-5 h-5 mt-0.5 rounded border-slate-500 text-brand-blue-600 focus:ring-brand-blue-500 flex-shrink-0"
            />
            <span className="text-white text-sm leading-relaxed">
              I have watched the orientation video and read all sections of the student handbook. I understand the clocking requirements, auto clock-out rules, LMS coursework expectations, payment auto-draft schedule, and the consequences of missed payments or conduct violations. I agree to proceed.
            </span>
          </label>
          <button
            onClick={handleComplete}
            disabled={!allSlidesRead || !acknowledged || submitting}
            className="w-full py-3 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition text-sm"
          >
            {submitting ? 'Processing…' : 'Continue to Program Documents →'}
          </button>
          {!allSlidesRead && (
            <p className="text-black text-xs text-center">
              Read all {HANDBOOK_SLIDES.length} handbook sections to unlock this step.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
