import Image from 'next/image';
import type { ReactNode } from 'react';

export default function PictureFirstPageHero({
  image,
  alt,
  eyebrow,
  title,
  description,
  actions,
}: {
  image: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="relative aspect-[16/7] min-h-[240px] w-full overflow-hidden bg-slate-100 sm:min-h-[320px] lg:min-h-[380px]">
        <Image
          src={image}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
        {eyebrow ? (
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-700 sm:text-lg">
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
