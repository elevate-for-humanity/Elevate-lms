import Link from 'next/link';

const steps = [
  {
    title: 'Open your lesson',
    text: 'Go to My Courses, open your course, and select the next lesson. Lessons open in order. Some courses also release lessons by week, so a locked lesson usually means an earlier lesson is not finished or its week has not started yet.',
  },
  {
    title: 'Watch the video on a bigger screen',
    text: 'Select Theory lesson & video to watch. If the video looks small or short, select Full screen lesson or Focus Mode, or use the full-screen button on the player. Split view shows the video and workbook side by side, which makes the video smaller.',
  },
  {
    title: 'Answer the workbook activities',
    text: 'If your lesson has a workbook, select Workbook & lesson activities. Type your answers in the boxes. Your work saves to your account about one second after you stop typing.',
  },
  {
    title: 'Check that it saved',
    text: 'Look at the status next to your answers. Saving… means it is still saving. Saved to your account means it is stored and will be there on any device. Unsaved changes or Save failed means it is not saved yet: stay on the page and try again before you leave.',
  },
  {
    title: 'Mark the chapter as reviewed',
    text: 'Write at least 10 characters for every writing activity, then check "I reviewed this lesson and my practice responses." You can review chapters in any order, but every chapter in the workbook must be reviewed to finish the course.',
  },
  {
    title: 'Finish the lesson',
    text: 'Complete the knowledge checks, then finish the lesson. If it says to complete and save the matching workbook activities, go back to Workbook & lesson activities and make sure every answer shows Saved to your account and the review box is checked.',
  },
];

const problems = [
  {
    message: 'Newer answers were saved in another tab or device',
    fix: 'Your workbook is open in more than one place. Copy your new text, close the other tabs, reload the lesson, and paste your text back in. Use one tab at a time.',
  },
  {
    message: 'Your sign-in changed',
    fix: 'You signed in or out in another tab. Copy your unsaved answers, sign in again with your own account, then reopen the lesson.',
  },
  {
    message: 'Copy unsaved answers from this browser',
    fix: 'A save did not finish earlier, so a copy was kept on this device. Open it, compare it with your saved answers, and copy back anything that is missing.',
  },
  {
    message: 'Please sign in to save your answers',
    fix: 'Your session timed out. Copy your text, sign in again, and paste it back in.',
  },
];

/** Shown to every learner so lesson, workbook, and video steps are clear before they start. */
export default function LessonWorkSavingGuide() {
  return (
    <section
      aria-labelledby="lesson-work-saving-guide"
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-blue-800">How lessons work</p>
      <h2 id="lesson-work-saving-guide" className="mt-2 text-2xl font-black text-slate-950">
        How your lessons and workbook save
      </h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-800">
        Follow these steps in every lesson so your work is saved and your progress counts.
      </p>
      <ol className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-800 text-sm font-bold text-white"
              >
                {index + 1}
              </span>
              <h3 className="pt-1 text-base font-bold leading-6 text-slate-950">{step.title}</h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-800">{step.text}</p>
          </li>
        ))}
      </ol>
      <details className="mt-5 rounded-xl border border-slate-200 p-4">
        <summary className="min-h-11 cursor-pointer font-bold text-slate-950">
          I saw an error message. What do I do?
        </summary>
        <dl className="mt-3 space-y-4 text-sm leading-7">
          {problems.map((problem) => (
            <div key={problem.message}>
              <dt className="font-bold text-slate-950">“{problem.message}”</dt>
              <dd className="text-slate-800">{problem.fix}</dd>
            </div>
          ))}
          <div>
            <dt className="font-bold text-slate-950">Still stuck?</dt>
            <dd className="text-slate-800">
              Do not close the page. Copy your answers, then contact{' '}
              <Link href="/lms/support" className="font-bold text-blue-800 underline">
                learner support
              </Link>{' '}
              with your course, lesson name, and the exact message you see.
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
