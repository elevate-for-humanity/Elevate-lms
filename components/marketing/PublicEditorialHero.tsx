import Image from 'next/image';
import type { ReactNode } from 'react';

/** Keep the complete photograph visible and the page introduction readable. */
export function PublicEditorialHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:py-10 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">{description}</p>
          {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
        </div>
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Image
            src={image}
            alt={imageAlt}
            width={1600}
            height={1067}
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="h-auto w-full"
          />
        </figure>
      </div>
    </section>
  );
}
