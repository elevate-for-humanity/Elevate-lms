import { IMAGE_LOADING_BLUR } from '@/lib/ui/blur-placeholder';
import Image from 'next/image';
import type { ReactNode } from 'react';

export function TaxHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  image: string;
  imageAlt: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden bg-[#082b66] text-white">
      <div className="grid lg:min-h-[500px] lg:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] !text-white">
            {eyebrow}
          </p>
          <h1 className="mt-5 max-w-xl text-4xl font-black leading-[1.08] tracking-tight !text-white sm:text-5xl xl:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 !text-white">{description}</p>
          <div className="mt-8 flex flex-wrap gap-3">{children}</div>
        </div>
        <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-full">
          <Image placeholder="blur" blurDataURL={IMAGE_LOADING_BLUR}
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-center"
          />
        </div>
      </div>
    </section>
  );
}
