import Image from "next/image";
import Link from "next/link";
import { getMediaBySlot, MediaSlot } from "../lms-data/mediaSlots";

interface HeroBannerProps {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryText?: string;
  mediaSlot: MediaSlot;
}

export function HeroBanner({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  secondaryText,
  mediaSlot,
}: HeroBannerProps) {
  const media = getMediaBySlot(mediaSlot);

  return (
    <section className="bg-slate-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center">
        <div className="flex-1 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-orange-400">
            Elevate for Humanity Career & Training Institute
          </p>
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="text-xs text-slate-300 md:text-sm">{subtitle}</p>
          {secondaryText && (
            <p className="text-[11px] text-slate-400">{secondaryText}</p>
          )}
          {ctaLabel && ctaHref && (
            <div className="pt-2">
              <Link
                href={ctaHref}
                className="inline-flex rounded-lg bg-brand-orange-600 px-4 py-2 text-[11px] font-semibold text-white shadow hover:bg-brand-orange-700"
              >
                {ctaLabel}
              </Link>
            </div>
          )}
        </div>

        {media && (
          <div className="relative h-52 w-full flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-lg md:h-64">
            <Image
              src={media.imageSrc}
              alt={media.alt}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}
