import Link from 'next/link';

const LOCKED_TOOLS = ['Course lessons', 'Assignments and quizzes', 'Workbook', 'Timeclock and hours', 'Progress and grades', 'Credentials'];

export function BeautyPaymentLock({ programSlug }: { programSlug: string }) {
  const label = programSlug.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8" aria-label="Apprenticeship access pending payment">
      <section role="status" className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-slate-950">
        <h1 className="text-2xl font-bold">Enrollment deposit required</h1>
        <p className="mt-3">Your application for {label} is saved. Training and the student dashboard remain locked until your deposit or authorized workforce funding is verified and enrollment is activated.</p>
        <p className="mt-2 text-sm">Your application has not been deleted. If you have already paid, contact Admissions so your existing payment can be reconciled without submitting another application.</p>
        <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white" href={`https://www.elevateforhumanity.org/programs/${programSlug}/apply`}>
          Continue application and payment
        </Link>
      </section>
      <section className="grid grid-cols-1 gap-4 opacity-50 grayscale sm:grid-cols-2" aria-label="Locked student tools">
        {LOCKED_TOOLS.map(label => (
          <div key={label} aria-disabled="true" className="pointer-events-none rounded-xl border border-slate-300 bg-slate-100 p-5 text-slate-700">
            <span aria-hidden="true">🔒</span> <span className="font-semibold">{label}</span>
            <p className="mt-2 text-sm">Available after verified enrollment.</p>
          </div>
        ))}
      </section>
    </main>
  );
}
