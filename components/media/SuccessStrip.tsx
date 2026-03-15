import Image from "next/image";
import type { SuccessStoryImage } from "@/lms-data/media";

interface SuccessStripProps {
  stories: SuccessStoryImage[];
}

export function SuccessStrip({ stories }: SuccessStripProps) {
  if (!stories.length) return null;

  return (
    <section className="border-b border-slate-800 bg-white">
      <div className="mx-auto max-w-6xl px-3 py-5 text-white md:px-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-orange-400">
              Real People, Real Outcomes
            </p>
            <h2 className="text-base font-bold md:text-lg">
              Success Stories & Impact
            </h2>
            <p className="mt-1 text-[11px] text-slate-600 md:text-xs">
              These images represent the kinds of wins Elevate is built for:
              stable jobs, credentials, and confidence.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-800/80"
            >
              <div className="relative w-full overflow-hidden aspect-[4/3]">
                <Image
                  src={story.src}
                  alt={story.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col px-3 py-2 text-[11px]">
                <p className="font-semibold text-slate-100">{story.name}</p>
                <p className="mt-0.5 text-[11px] text-brand-green-300">
                  {story.outcome}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  "{story.quote}"
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
