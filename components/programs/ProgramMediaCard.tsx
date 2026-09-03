import Image from 'next/image';
import { card } from '@/lib/page-design-tokens';

interface ProgramMediaCardProps {
  src: string;
  alt: string;
  title: string;
  subtitle?: string;
  step?: number;
  className?: string;
}

/**
 * Image card with caption below — no gradient overlay, no text on image.
 */
export function ProgramMediaCard({
  src,
  alt,
  title,
  subtitle,
  step,
  className = '',
}: ProgramMediaCardProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className={card.programImage}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={card.programImageFill}
          placeholder="empty"
        />
        {step != null ? (
          <span
            className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-red-600 text-sm font-extrabold text-white shadow"
            aria-hidden="true"
          >
            {step}
          </span>
        ) : null}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-sm font-bold leading-snug text-slate-900">{title}</p>
        {subtitle ? (
          <p className="mt-1 text-xs leading-snug text-slate-600">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
