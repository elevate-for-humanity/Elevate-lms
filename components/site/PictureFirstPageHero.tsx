import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

/**
 * Compatibility wrapper for picture-first public pages.
 *
 * Media rendering is delegated to the canonical Marketing HeroPicture so image
 * sizing, loading behavior, accessibility, and future fallback changes stay in
 * one implementation. This component only preserves the page-specific copy and
 * action layout used by existing routes.
 */
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
    <HeroPicture src={image} alt={alt} analyticsName="picture-first-page">
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
    </HeroPicture>
  );
}
