import Image from "next/image";
import Link from "next/link";
import type { ProgramHighlightImage } from "@/lms-data/media";

interface HomeProgramStripProps {
  items: ProgramHighlightImage[];
}

export function HomeProgramStrip({ items }: HomeProgramStripProps) {
  if (!items.length) return null;

  return (
    <section className="border-b border-slate-800 bg-slate-800">
      <div className="mx-auto max-w-6xl px-3 py-5 text-white md:px-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-orange-400">
              Program Pathways
            </p>
            <h2 className="text-base font-bold md:text-lg">
              Where Elevate Helps You Grow
            </h2>
            <p className="mt-1 text-[11px] text-slate-300 md:text-xs">
              Beauty, healthcare, trades, business, tax/VITA and more, aligned
              with credential partners and real employers.
            </p>
          </div>
          <Link
            href="/programs"
            className="mt-2 inline-flex h-8 items-center justify-center rounded-md border border-slate-600 px-3 text-[11px] font-semibold text-slate-100 hover:bg-slate-800 md:mt-0"
          >
            View All Programs
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-800/80"
            >
              <div className="relative w-full overflow-hidden aspect-[4/3]">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col px-3 py-2 text-[11px]">
                <p className="font-semibold text-slate-100">{item.label}</p>
                <p className="mt-1 line-clamp-3 text-slate-300">
                  {item.description}
                </p>
                <div className="mt-auto pt-2">
                  {item.programId ? (
                    <Link
                      href={`/programs/${item.programId}`}
                      className="text-[11px] font-semibold text-brand-orange-300 hover:text-brand-orange-200"
                    >
                      Explore this pathway →
                    </Link>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      Program highlight
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
