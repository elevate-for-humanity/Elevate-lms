'use client';
import { useState } from 'react';
import Link from 'next/link';
import { APPRENTICE_TIME_POLICY } from '@/lib/timeclock/policy';

function ClockPicture({ theory = false }: { theory?: boolean }) {
  return (
    <svg viewBox="0 0 320 160" aria-hidden="true" className="h-36 w-full">
      <rect x="28" y="22" width="162" height="108" rx="12" fill={theory ? '#164e63' : '#064e3b'} />
      {theory ? (
        <>
          <rect x="40" y="34" width="138" height="78" rx="4" fill="#ecfeff" />
          <path d="m90 54 34 19-34 19Z" fill="#0e7490" />
          <path d="M15 136h188" stroke="#334155" strokeWidth="10" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M40 62h138M70 62v56m78-56v56" stroke="#a7f3d0" strokeWidth="7" />
          <circle cx="108" cy="46" r="10" fill="#a7f3d0" />
          <path
            d="m103 78-16 27m25-27 16 27"
            stroke="#a7f3d0"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </>
      )}
      <circle
        cx="242"
        cy="80"
        r="49"
        fill="white"
        stroke={theory ? '#0e7490' : '#047857'}
        strokeWidth="7"
      />
      <path
        d="M242 48v34l22 14"
        fill="none"
        stroke="#0f172a"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="242" cy="80" r="5" fill="#0f172a" />
    </svg>
  );
}

function LunchPicture() {
  return (
    <svg viewBox="0 0 320 150" aria-hidden="true" className="h-32 w-full">
      <circle cx="108" cy="75" r="52" fill="#f1f5f9" stroke="#475569" strokeWidth="5" />
      <circle cx="108" cy="75" r="34" fill="white" stroke="#94a3b8" strokeWidth="3" />
      <path
        d="M32 29v92M20 29v29q12 15 24 0V29m145 0v92m0-92q25 27 0 53"
        fill="none"
        stroke="#334155"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="256" cy="75" r="40" fill="white" stroke="#334155" strokeWidth="5" />
      <path
        d="M256 49v27l15 10"
        fill="none"
        stroke="#334155"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SitePicture() {
  return (
    <svg viewBox="0 0 320 150" aria-hidden="true" className="h-32 w-full">
      <ellipse
        cx="130"
        cy="102"
        rx="105"
        ry="36"
        fill="#e0e7ff"
        stroke="#4338ca"
        strokeWidth="3"
        strokeDasharray="7 6"
      />
      <path d="m68 62 62-39 62 39v55H68Z" fill="white" stroke="#3730a3" strokeWidth="4" />
      <path d="M119 117V78h24v39M85 73h17v18H85m72-18h17v18h-17" fill="#a5b4fc" />
      <path
        d="M228 76h59m-15-13 15 13-15 13"
        fill="none"
        stroke="#3730a3"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="272" cy="38" r="12" fill="#3730a3" />
      <path
        d="m268 57-14 30m15-29 14 13m-22 7-14 30m15-27 13 25"
        fill="none"
        stroke="#3730a3"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrainingVisualGuide({ courseHref }: { courseHref?: string }) {
  const [active, setActive] = useState(0);
  const topics = ['Plan my week', 'My two clocks', 'Finish a lesson', 'Lunch & location'];
  return (
    <section aria-label="Interactive training guide" className="my-5 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-950 shadow-sm">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-800">Your learning studio</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Make training fit your week.</h2>
          <p className="mt-3 max-w-md text-slate-600">Choose a topic below. See the steps, then open the tool you need.</p>
        </div>
        <img src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-apprenticeship-hero.webp"
          alt="Cosmetology professional at a salon workstation" width={1280} height={720}
          loading="lazy" className="h-56 w-full object-cover object-top md:h-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 border-y border-slate-200 bg-slate-50 p-3 sm:grid-cols-4" aria-label="Choose a training topic">
        {topics.map((topic, index) => <button key={topic} type="button" aria-pressed={active === index}
          onClick={() => setActive(index)}
          className={`min-h-12 rounded-xl px-3 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700 ${active === index ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-teal-50'}`}>{topic}</button>)}
      </div>
      <div className="p-5 sm:p-8" aria-live="polite">
        {active === 0 && <div>
          <h3 className="text-xl font-semibold">A little at a time. Every week.</h3>
          <p className="mt-2 text-slate-600">Example: a 3½-hour target split into three study sessions.</p>
          <ol className="mt-5 grid gap-3 sm:grid-cols-3">
            {['Tuesday', 'Thursday', 'Saturday'].map(day => <li key={day} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">{day}</p><p className="mt-2 text-3xl font-semibold text-slate-950">70 <span className="text-base font-normal">min</span></p>
              <p className="mt-2 text-sm text-slate-600">Example: 6:00–7:10 PM</p>
            </li>)}
          </ol>
          <p className="mt-4 text-sm text-slate-600">Choose your own downtime outside shop hours. Your personal target appears on your schedule.</p>
          <Link href="/apprentice/theory-schedule" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white hover:bg-teal-900">Set my study times →</Link>
          <details className="mt-5 border-t border-slate-200 pt-4"><summary className="cursor-pointer font-semibold">How weekly access works</summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">Your 40 lessons follow your 52-week plan. Existing students keep their original training dates. Released lessons and linked workbook sections open during saved study windows. Future lessons and time above your weekly limit remain locked. Finish weekly work by Sunday at 11:59 PM in your schedule’s time zone. Lessons newly released today are not overdue.</p>
          </details>
        </div>}
        {active === 1 && <div>
          <div className="grid gap-5 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 p-4"><ClockPicture /><h3 className="text-xl font-semibold">Shop / OJL</h3>
              <p className="mt-2 text-2xl font-semibold">Up to {APPRENTICE_TIME_POLICY.weeklyOjlMaxHours} hours / week</p><p className="mt-2 text-sm text-slate-600">Approved, supervised workplace training. Clock out for time away.</p></article>
            <article className="rounded-2xl border border-slate-200 p-4"><ClockPicture theory /><h3 className="text-xl font-semibold">Online theory</h3>
              <p className="mt-2 text-2xl font-semibold">Your personal weekly target</p><p className="mt-2 text-sm text-slate-600">Press Start theory timeclock inside your available lesson or workbook. Stop when you finish.</p></article>
          </div>
          <details className="mt-5 border-t border-slate-200 pt-4"><summary className="cursor-pointer font-semibold">Hour limits and credit</summary><p className="mt-3 text-sm leading-6 text-slate-600">Never run both clocks together. Elevate caps theory at {APPRENTICE_TIME_POLICY.weeklyTheoryMaxHours} hours and combined OJL/theory at {APPRENTICE_TIME_POLICY.weeklyCombinedMaxHours} hours weekly; lower assigned limits apply. These are program scheduling limits. Eligible recorded time requires review before credit. Shop hours do not complete theory lessons.</p></details>
        </div>}
        {active === 2 && <div>
          <h3 className="text-xl font-semibold">Four steps to saved progress</h3>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {[['Start', 'Press Start theory timeclock.'], ['Learn', 'Watch, practice, and save workbook answers.'], ['Stop', 'Stop the clock when you finish or take a break.'], ['Complete', 'Use Go to lesson completion, finish required checks, then Mark lesson complete.']].map(([title, text], i) =>
              <li key={title} className="flex gap-4 rounded-2xl bg-slate-50 p-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-800 font-semibold text-white">{i + 1}</span><div><h4 className="font-semibold">{title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></li>)}
          </ol>
          <p className="mt-4 text-sm text-slate-600">Quiz, engagement, and required shop signoff checks still apply. Saving workbook answers does not complete the lesson or approve hours.</p>
          <div className="mt-5 flex flex-wrap gap-3">{courseHref && <Link href={courseHref} className="rounded-xl bg-teal-800 px-5 py-3 font-semibold text-white">Open lessons →</Link>}
            <Link href="/workbooks/prestige-elevation-cosmetology" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold">Open workbook →</Link></div>
        </div>}
        {active === 3 && <div className="grid gap-5 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 p-5"><LunchPicture /><h3 className="text-xl font-semibold">One-hour lunch</h3><p className="mt-2 text-sm leading-6 text-slate-600">Use Start Lunch and End Lunch. Lunch is excluded from daily and weekly training hours.</p></article>
          <article className="rounded-2xl border border-slate-200 p-5"><SitePicture /><h3 className="text-xl font-semibold">Clock out before leaving</h3><p className="mt-2 text-sm leading-6 text-slate-600">Confirm clock-out at your approved site. The assigned geofence and grace period apply. Flagged time requires review.</p></article>
        </div>}
      </div>
    </section>
  );
}

