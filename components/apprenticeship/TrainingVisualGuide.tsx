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
      <circle cx="108" cy="75" r="52" fill="#fef3c7" stroke="#b45309" strokeWidth="5" />
      <circle cx="108" cy="75" r="34" fill="white" stroke="#f59e0b" strokeWidth="3" />
      <path
        d="M32 29v92M20 29v29q12 15 24 0V29m145 0v92m0-92q25 27 0 53"
        fill="none"
        stroke="#92400e"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="256" cy="75" r="40" fill="white" stroke="#92400e" strokeWidth="5" />
      <path
        d="M256 49v27l15 10"
        fill="none"
        stroke="#92400e"
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
  return (
    <details
      open
      className="my-5 overflow-hidden rounded-3xl border border-slate-300 bg-white text-slate-950"
    >
      <summary className="cursor-pointer bg-slate-950 px-5 py-5 text-lg font-black text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-cyan-500">
        Picture guide: my clocks, study week, and lesson completion
        <span className="mt-1 block text-sm font-normal text-slate-200">
          Open the pictures and step-by-step examples
        </span>
      </summary>
      <div className="space-y-6 p-4 sm:p-6">
        <figure className="overflow-hidden rounded-2xl bg-slate-100">
          {/* Existing LMS photo, also used by the opening cosmetology lesson. */}
          <img
            src="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/cosmetology-apprenticeship-hero.webp"
            alt="Cosmetology professional at a salon workstation"
            width={1280}
            height={720}
            loading="lazy"
            className="max-h-64 w-full object-cover"
          />
          <figcaption className="p-4 font-semibold">
            One training plan. Two separate clocks. Shop practice and online theory each have their
            own record.
          </figcaption>
        </figure>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <ClockPicture />
            <h3 className="text-xl font-black">Shop / OJL clock</h3>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              Up to {APPRENTICE_TIME_POLICY.weeklyOjlMaxHours} hours / week
            </p>
            <p className="mt-3">
              Use this clock for approved, supervised workplace training. Clock out for time away.
              Lunch and theory do not count as OJL.
            </p>
          </article>
          <article className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <ClockPicture theory />
            <h3 className="text-xl font-black">Theory study clock</h3>
            <p className="mt-2 text-3xl font-black text-cyan-900">Your assigned weekly target</p>
            <p className="mt-3">
              See your personal target on the schedule page. Elevate caps theory at{' '}
              {APPRENTICE_TIME_POLICY.weeklyTheoryMaxHours} hours per week; a lower assigned limit
              still applies. This cap is a program scheduling rule, not a universal Indiana law.
            </p>
          </article>
        </div>
        <p className="rounded-xl bg-slate-100 p-4 font-bold">
          Never run both clocks together. Combined OJL and theory cannot exceed{' '}
          {APPRENTICE_TIME_POLICY.weeklyCombinedMaxHours} hours per week. Time must be eligible and
          reviewed before it becomes approved credit.
        </p>

        <section
          aria-label="Example theory study week"
          className="rounded-2xl border border-slate-200 p-4"
        >
          <h3 className="text-xl font-black">
            Example: split a 3½-hour theory target into downtime
          </h3>
          <p className="mt-2">
            Illustration only. Choose your own available times outside OJL; follow the target shown
            in your account.
          </p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ['Tuesday', '70 minutes'],
              ['Thursday', '70 minutes'],
              ['Saturday', '70 minutes'],
            ].map(([day, duration]) => (
              <li
                key={day}
                className="rounded-xl border-2 border-cyan-700 bg-cyan-50 p-4 text-center"
              >
                <span className="block font-black">{day}</span>
                <span className="mt-2 block text-xl font-black text-cyan-950">{duration}</span>
                <span className="mt-2 block text-sm">Scheduled theory study</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 font-semibold">
            70 + 70 + 70 = 210 minutes (3½ hours). For example, 6:00–7:10 PM on each selected day.
            Save times that fit your actual downtime in My theory schedule.
          </p>
          <p className="mt-3">
            Use released lessons and the workbook during your scheduled study windows. Future
            lessons, closed windows, and time above your weekly limit are blocked when scheduled
            access is active. Finish assigned weekly work by Sunday at 11:59 PM in your schedule’s
            time zone.
          </p>
          <Link
            href="/apprentice/theory-schedule"
            className="mt-4 inline-block rounded-xl bg-cyan-950 px-4 py-3 font-bold text-white"
          >
            Choose my study times
          </Link>
        </section>

        <section aria-label="How to finish a lesson">
          <h3 className="text-xl font-black">From study time to saved completion</h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              [
                '1',
                'Start the theory clock',
                'Open an available lesson or linked workbook section during your study window. Press Start theory timeclock.',
              ],
              [
                '2',
                'Watch, practice, and save',
                'Watch the lesson, complete its activities, and save workbook answers. Saving an answer does not finish the lesson or approve hours.',
              ],
              [
                '3',
                'Stop the theory clock',
                'Stop when you finish studying or take a break. Leaving a page open or running inactive time does not earn training hours.',
              ],
              [
                '4',
                'Save lesson completion',
                'Use Go to lesson completion below the video. Meet the quiz, activity, time, and any required shop signoff checks, then select Mark lesson complete.',
              ],
            ].map(([number, title, body]) => (
              <li key={number} className="rounded-xl border border-slate-200 p-4">
                <span
                  aria-hidden="true"
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-xl font-black text-white"
                >
                  {number}
                </span>
                <h4 className="font-black">{title}</h4>
                <p className="mt-2">{body}</p>
              </li>
            ))}
          </ol>
          {courseHref ? (
            <Link
              href={courseHref}
              className="mt-4 inline-block rounded-xl bg-emerald-950 px-4 py-3 font-bold text-white"
            >
              Open my released lessons
            </Link>
          ) : null}
          <Link
            href="/workbooks/prestige-elevation-cosmetology"
            className="ml-0 mt-4 inline-block rounded-xl border border-slate-700 px-4 py-3 font-bold sm:ml-3"
          >
            Open my digital workbook
          </Link>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <LunchPicture />
            <h3 className="text-xl font-black">One-hour lunch = no training credit</h3>
            <p className="mt-3">
              Press Start Lunch before your break and End Lunch when training resumes. A one-hour
              lunch is excluded from your daily and weekly hours. Example: 9 hours onsite minus a
              recorded 1-hour lunch = 8 training hours, before other unpaid breaks or review
              adjustments.
            </p>
          </article>
          <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <SitePicture />
            <h3 className="text-xl font-black">Leaving the site? Clock out first.</h3>
            <p className="mt-3">
              Confirm clock-out before leaving the approved workplace boundary. Your assigned site’s
              geofence and grace period apply. Off-site or flagged time is not automatic training
              credit; contact your supervisor if an action fails.
            </p>
          </article>
        </div>
        <p className="text-sm text-slate-700">
          Your 40 lessons are spread across your 52-week training plan. Existing students keep their
          original training start and end dates; newly available online lessons are spread across
          their remaining weeks. OJL hours do not automatically complete theory lessons.
        </p>
      </div>
    </details>
  );
}
