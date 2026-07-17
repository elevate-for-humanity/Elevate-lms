export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { careerTrainingAreas } from '@/content/cf-career-training';
import { buildMetadata } from '@/lib/cf-seo';

export const metadata = buildMetadata({
  title: 'Career Training',
  description:
    'Workforce career training programs in healthcare, skilled trades, technology, beauty, and business. WIOA funding available.',
  path: '/career-training',
});

export default function CareerTrainingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold">Career Training</h1>
      <p className="mt-4 text-slate-700">
        Short-term, credential-bearing programs designed for workforce entry and career advancement.
        WIOA and Workforce Ready Grant funding available for eligible Indiana residents.
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {careerTrainingAreas.map((area) => (
          <article key={area.slug} className="rounded border p-6 hover:bg-slate-50">
            <h2 className="text-xl font-semibold">{area.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{area.summary}</p>
            <ul className="mt-3 space-y-1">
              {area.programs.map((p) => (
                <li key={p} className="text-sm text-slate-600">
                  · {p}
                </li>
              ))}
            </ul>
            <Link
              href={`/career-training/${area.slug}`}
              className="mt-4 inline-block text-sm underline"
            >
              View programs
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
