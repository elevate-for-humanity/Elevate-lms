'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PRESTIGE_ELEVATION_BARBER_CURRICULUM } from '@/lib/barber/branding';

export interface BarberPaymentSummary {
  downPayment: number;
  remainingBalance: number;
  weeklyPaymentCents: number;
  weeksRemaining: number;
  fullyPaid: boolean;
}

const BARBER = RAPIDS_CONFIG.programs.barber;

const SLIDES = [
  {
    id: 'program',
    icon: ShieldCheck,
    title: 'Registered Program Requirements',
    items: [
      `Sponsor of record: ${RAPIDS_CONFIG.sponsorOfRecord}.`,
      `Occupation: ${BARBER.occupation}. The registered schedule requires ${BARBER.totalHours.toLocaleString()} hours of supervised on-the-job learning (OJL) plus ${BARBER.relatedInstructionHours} hours of Related Technical Instruction (RTI).`,
      'Indiana school-hour rules and registered-apprenticeship hour requirements are separate pathways and must not be combined.',
      'Completion requires verified hour records, required RTI, competency evidence, and the licensing steps in effect when you apply.',
    ],
  },
  {
    id: 'hours',
    icon: Clock3,
    title: 'Hour Tracking & Verification',
    items: [
      'Clock in only when you are physically present for approved apprenticeship work and clock out when your approved work period ends.',
      'Your host-shop supervisor must verify OJL records. Unverified or falsified time cannot be credited.',
      'Prior training or transfer-hour requests require documentation and program review; prior hours are not automatically accepted.',
      'Transfer credit affects progress only as approved. It does not automatically reduce the fixed self-pay tuition.',
    ],
  },
  {
    id: 'location',
    icon: MapPin,
    title: 'Host Shop & Location Rules',
    items: [
      'OJL must occur at an approved participating location under qualified supervision.',
      'Location verification may be used when recording hours. Do not attempt to spoof or falsify location data.',
      'A listed host shop is not a guarantee of placement, employment, wages, commission, tips, or continued assignment.',
      'Report placement, supervision, safety, or scheduling concerns to your program contact promptly.',
    ],
  },
  {
    id: 'rti',
    icon: BookOpen,
    title: PRESTIGE_ELEVATION_BARBER_CURRICULUM,
    items: [
      `Your ${PRESTIGE_ELEVATION_BARBER_CURRICULUM} coursework is delivered through Elevate LMS after enrollment access is activated.`,
      `The registered RTI requirement is ${BARBER.relatedInstructionHours} hours. Your LMS completion record is the controlling RTI record.`,
      'Complete assigned lessons, assessments, and competency activities according to the current course requirements.',
      'Do not share your account. Course activity and progress are associated with your enrollment record.',
    ],
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'Tuition & Payment',
    items: [
      `Current self-pay tuition is ${formatMoney(BARBER_PRICING.fullPrice)}.`,
      `The standard minimum down payment is ${formatMoney(BARBER_PRICING.minDownPayment)} unless your executed checkout/enrollment agreement states a different approved amount.`,
      `The standard self-pay term is ${BARBER_PRICING.paymentTermWeeks} weekly billing periods. Your actual payment summary is shown below.`,
      'Third-party funding is separate from self-pay pricing and is not guaranteed. The responsible funder controls eligibility, authorized amount, and covered costs.',
    ],
  },
  {
    id: 'conduct',
    icon: AlertTriangle,
    title: 'Conduct, Records & Support',
    items: [
      `You represent ${PLATFORM_DEFAULTS.orgName} while participating in the program and at a host shop. Professional and safe conduct is required.`,
      'Do not falsify attendance, hours, location, competency evidence, signatures, or other program records.',
      'Program access, placement, discipline, withdrawal, refund, and payment consequences are governed by your executed agreements and applicable program policies—not by an informal website statement.',
      `If something is incorrect in your record, contact the program before signing or submitting it. Support: ${PLATFORM_DEFAULTS.supportPhone}.`,
    ],
  },
] as const;

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function BarberOrientationClient({ payment }: { payment: BarberPaymentSummary }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoComplete, setVideoComplete] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentSlide = SLIDES[slideIndex];
  const handbookUnlocked = videoComplete || videoError;
  const allSlidesVisited = visited.size === SLIDES.length;
  const canComplete = handbookUnlocked && allSlidesVisited && acknowledged && !submitting;

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const percent = Math.min(100, (video.currentTime / video.duration) * 100);
    setVideoProgress(percent);
    if (percent >= 80) setVideoComplete(true);
  }

  function goToSlide(next: number) {
    if (next < 0 || next >= SLIDES.length) return;
    setVisited((previous) => new Set([...previous, next]));
    setSlideIndex(next);
  }

  async function completeOrientation() {
    if (!canComplete) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          step: 'orientation',
          data: {
            program: BARBER.slug,
            acknowledged_at: new Date().toISOString(),
            video_status: videoError ? 'unavailable-summary-reviewed' : 'watched-80-percent',
          },
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.success !== true) {
        throw new Error('Orientation completion was not saved');
      }

      router.push('/programs/barber-apprenticeship/documents');
      router.refresh();
    } catch {
      setSubmitError(
        `We could not save your orientation completion. Please try again. If the problem continues, call ${PLATFORM_DEFAULTS.supportPhone}.`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Barber Registered Apprenticeship</p>
            <h1 className="mt-1 text-xl font-extrabold text-white">Required Program Orientation</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <StepPill complete={handbookUnlocked}>1. Orientation media</StepPill>
            <StepPill complete={allSlidesVisited}>2. Program handbook</StepPill>
            <StepPill complete={acknowledged}>3. Acknowledgment</StepPill>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <section aria-labelledby="orientation-video-heading">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Step 1</p>
              <h2 id="orientation-video-heading" className="mt-1 text-xl font-extrabold text-white">Review the orientation media</h2>
            </div>
            <span className="text-sm text-slate-300">{Math.round(videoProgress)}%</span>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <video
              ref={videoRef}
              src="/videos/barber-lessons/barber-apprenticeship-intro.mp4"
              poster="/images/pages/about-career-training.webp"
              controls
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setVideoComplete(true)}
              onError={() => setVideoError(true)}
              className="h-full w-full object-cover"
            />
            {videoProgress === 0 && !videoError && (
              <button
                type="button"
                onClick={() => void videoRef.current?.play()}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 transition hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <Play className="ml-1 h-7 w-7 fill-white text-white" aria-hidden="true" />
                </span>
                <span className="font-bold text-white">Play orientation</span>
              </button>
            )}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
            <div className="h-full bg-white transition-all" style={{ width: `${videoProgress}%` }} />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {videoError
              ? 'The video could not be loaded. The written orientation below is unlocked so the outage does not block your required review.'
              : videoComplete
                ? 'Orientation media requirement complete. Continue through every written section below.'
                : 'Watch at least 80% of the orientation video to unlock the written program review.'}
          </p>
        </section>

        <section
          aria-labelledby="orientation-handbook-heading"
          className={`rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-7 ${handbookUnlocked ? '' : 'pointer-events-none opacity-45'}`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Step 2</p>
              <h2 id="orientation-handbook-heading" className="mt-1 text-xl font-extrabold text-white">Review every program section</h2>
            </div>
            <p className="text-sm text-slate-300">{visited.size}/{SLIDES.length} reviewed</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Orientation sections">
            {SLIDES.map((slide, index) => {
              const Icon = slide.icon;
              const active = index === slideIndex;
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    active
                      ? 'bg-white text-slate-950'
                      : visited.has(index)
                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                        : 'border border-white/15 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {visited.has(index) && !active ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                  {slide.title}
                </button>
              );
            })}
          </div>

          <article className="mt-5 rounded-2xl bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <currentSlide.icon className="h-5 w-5 text-red-300" aria-hidden="true" />
              <h3 className="text-lg font-extrabold text-white">{currentSlide.title}</h3>
            </div>
            <ul className="mt-4 space-y-3">
              {currentSlide.items.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-300" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {currentSlide.id === 'payment' && (
              <dl className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:grid-cols-2">
                <PaymentStat label="Program tuition" value={formatMoney(BARBER_PRICING.fullPrice)} />
                <PaymentStat label="Your down payment" value={formatMoney(payment.downPayment)} />
                <PaymentStat label="Remaining balance" value={formatMoney(payment.remainingBalance)} />
                <PaymentStat
                  label="Weekly payment"
                  value={payment.fullyPaid ? 'Paid in full' : formatMoney(payment.weeklyPaymentCents / 100)}
                />
                {!payment.fullyPaid && <PaymentStat label="Billing periods remaining" value={String(payment.weeksRemaining)} />}
              </dl>
            )}
          </article>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToSlide(slideIndex - 1)}
              disabled={slideIndex === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-bold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
            </button>
            <button
              type="button"
              onClick={() => goToSlide(slideIndex + 1)}
              disabled={slideIndex === SLIDES.length - 1}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950 sm:p-8" aria-labelledby="orientation-confirm-heading">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-red-700">Step 3</p>
          <h2 id="orientation-confirm-heading" className="mt-1 text-2xl font-extrabold">Confirm your review</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            By checking the box, you confirm that you reviewed all orientation sections and understand that the official program records, executed agreements, verified OJL/RTI records, and current licensing rules control if an informal statement conflicts with them.
          </p>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={!allSlidesVisited}
              className="mt-1 h-5 w-5 rounded border-slate-400"
            />
            <span className="text-sm font-semibold leading-6 text-slate-950">
              I reviewed every orientation section and acknowledge the program requirements and disclosures above.
            </span>
          </label>

          {!allSlidesVisited && (
            <p className="mt-3 text-sm font-medium text-amber-800">Review all {SLIDES.length} written sections before acknowledging completion.</p>
          )}

          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800" role="alert">
              {submitError}
            </div>
          )}

          <button
            type="button"
            onClick={() => void completeOrientation()}
            disabled={!canComplete}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white transition hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? 'Saving orientation…' : 'Complete Orientation & Continue to Documents'}
          </button>
        </section>
      </div>
    </main>
  );
}

function StepPill({ complete, children }: { complete: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full border px-3 py-1.5 ${complete ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-white/15 bg-white/5 text-slate-300'}`}>
      {complete ? '✓ ' : ''}{children}
    </span>
  );
}

function PaymentStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-extrabold text-white">{value}</dd>
    </div>
  );
}
