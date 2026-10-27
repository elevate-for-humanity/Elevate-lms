/** Public resources only. Owner-only review media must stay in the admin card. */
export default function ProgramGuideResources() {
  return (
    <details className="my-4 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 text-slate-950">
      <summary className="min-h-11 cursor-pointer text-lg font-bold">
        Explore programs and PARIS visual tours
      </summary>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        Browse the current program catalog or watch six narrated tours of Elevate’s tools.
        Tours include captions and transcripts. These resources supplement your orientation;
        watching them does not complete a lesson or award training hours.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href="https://www.elevateforhumanity.org/programs" className="inline-flex min-h-11 items-center rounded-xl bg-sky-800 px-4 py-3 text-sm font-bold text-white">
          Browse current programs
        </a>
        <a href="https://www.elevateforhumanity.org/store#platform-demos" className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold">
          Watch PARIS visual tours
        </a>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Funding depends on the program and individual eligibility. Apprenticeship costs are separate.
      </p>
    </details>
  );
}
