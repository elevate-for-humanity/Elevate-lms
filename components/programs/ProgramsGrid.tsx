import Link from "next/link";
import Image from "next/image";
import { getAllPrograms } from "@/lib/programs";

export async function ProgramsGrid() {
  const programs = await getAllPrograms();

  if (!programs || programs.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-black mb-4">No Programs Available</h2>
          <p className="text-black">Check back soon for new training programs.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-black md:text-3xl">
            Training & Career Pathways
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black">
            Elevate connects learners to training programs, apprenticeships, and career pathways
            across trades, healthcare, transportation, and career readiness.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <article
            key={program.slug}
            className="flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm"
          >
            <div className="relative h-40 w-full bg-slate-100">
              {program.hero_image_url || program.image_url ? (
                <Image
                  src={program.hero_image_url || program.image_url || '/images/programs-hq/training-classroom.jpg'}
                  alt={program.title || program.name}
                  fill
          sizes="100vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center   ">
                  <svg className="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor"
viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h2 className="text-sm font-semibold text-black">{program.title || program.name}</h2>
              <p className="mt-1 line-clamp-3 text-xs text-black">{program.description}</p>
              <p className="mt-2 text-[11px] font-medium text-slate-500">{program.category}</p>
              {program.training_hours && (
                <p className="text-[11px] text-slate-500">Duration: {program.training_hours} hours</p>
              )}
              {program.funding_tags && program.funding_tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {program.funding_tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-brand-blue-100 text-brand-blue-700 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Link
                  href={`/programs/${program.slug}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  View Program Details
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
