import Link from 'next/link';
import type { ProgramHolderWorkspace } from '@/lib/program-holder/workspace';
import VisualDashboardOrientation from '@/components/orientation/VisualDashboardOrientation';

export function ReadingDashboard({ data }: { data: ProgramHolderWorkspace }) {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6">
      <header className="rounded-2xl border border-slate-300 bg-white p-6">
        <h1 className="text-3xl font-bold">
          Hello, {data.profile?.full_name?.split(' ')[0] || 'welcome'}
        </h1>
        <p className="mt-3">Choose one task below.</p>
      </header>
      <nav aria-label="Main tasks" className="grid gap-4 sm:grid-cols-2">
        {[
          [
            'My students',
            '/program-holder/students',
            'See names, phone numbers and email addresses.',
          ],
          [
            'New applications',
            '/program-holder/students/pending',
            'Read applications and contact applicants.',
          ],
          ['My programs', '/program-holder/programs', 'Open courses and program instructions.'],
          ['My host shop', '/host-shop/dashboard', 'Open hands-on training and shop records.'],
        ].map(([title, href, detail]) => (
          <Link
            key={href}
            href={href}
            className="block rounded-2xl border-2 border-slate-400 bg-white p-6 text-slate-950 hover:border-blue-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-blue-800"
          >
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-3">{detail}</p>
          </Link>
        ))}
      </nav>
      <section aria-labelledby="reading-programs">
        <h2 id="reading-programs" className="text-2xl font-bold">
          Your programs
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {data.programs.map((program) => (
            <li key={program.id} className="rounded-2xl border border-slate-300 bg-white p-5">
              <h3 className="text-xl font-bold">{program.title || program.name}</h3>
              <p className="mt-2">
                {data.enrollments.filter((row) => row.program_id === program.id).length} students
              </p>
              <Link
                className="mt-3 inline-flex min-h-12 items-center font-bold text-blue-900 underline"
                href="/program-holder/programs"
              >
                Open program instructions
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Watch or read the steps</h2>
        <VisualDashboardOrientation audience="program-holder" />
      </section>
      <details className="rounded-2xl border border-slate-300 bg-white p-6">
        <summary className="cursor-pointer text-xl font-bold">More tools</summary>
        <nav aria-label="More tasks" className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ['Documents', 'documents'],
            ['Training hours', 'hours'],
            ['Reports', 'reports'],
            ['Email', 'email'],
            ['Phone', 'phone'],
            ['Calendar', 'meetings'],
          ].map(([label, path]) => (
            <Link
              className="inline-flex min-h-12 items-center font-bold text-blue-900 underline"
              key={path}
              href={`/program-holder/${path}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </details>
    </main>
  );
}
