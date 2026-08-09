import Image from 'next/image';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

function programLabel(program: string) {
  return program
    .replace(/-apprenticeship$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FeaturedHostPartners() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
          Training network
        </p>
        <h2 className="mt-2 text-center text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Host barbershops &amp; training partners
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-center text-base font-medium leading-7 text-slate-700">
          Indiana host shops supporting hands-on apprenticeship training, supervised workplace learning,
          and career development.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => (
            <article
              key={shop.name}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              {shop.media?.length ? (
                <div
                  className={
                    shop.media.length > 1
                      ? 'grid grid-cols-2 gap-px bg-slate-200'
                      : 'bg-slate-100'
                  }
                >
                  {shop.media.map((media) => (
                    <div
                      key={media.src}
                      className={`relative overflow-hidden bg-slate-100 ${
                        shop.media && shop.media.length > 1 ? 'aspect-[4/5]' : 'aspect-[4/3]'
                      }`}
                    >
                      <Image
                        src={media.src}
                        alt={media.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className={media.kind === 'flyer' ? 'object-contain bg-white p-2' : 'object-cover'}
                      />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight text-slate-950">
                      {shop.dba ?? shop.name}
                    </h3>
                    {shop.dba ? (
                      <p className="mt-1 text-sm font-semibold text-slate-600">Legal name: {shop.name}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-brand-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-blue-800">
                    {shop.city}, {shop.state}
                  </span>
                </div>

                {shop.note ? (
                  <p className="mt-4 text-sm font-medium leading-6 text-slate-700">{shop.note}</p>
                ) : null}

                {shop.phone ? (
                  <p className="mt-3 text-sm font-bold text-slate-800">Phone: {shop.phone}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  {shop.programs.map((program) => (
                    <span
                      key={program}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                    >
                      {programLabel(program)}
                    </span>
                  ))}
                </div>

                {(shop.resourceUrl || shop.websiteUrl) && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                    {shop.websiteUrl ? (
                      <a
                        href={shop.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-slate-50"
                      >
                        Visit shop website
                      </a>
                    ) : null}
                    {shop.resourceUrl ? (
                      <a
                        href={shop.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-brand-red-700"
                      >
                        {shop.resourceLabel ?? 'View shop document'}
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
