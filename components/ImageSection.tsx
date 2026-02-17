import Image from "next/image";
import { getMediaBySlot, MediaSlot } from "../lms-data/mediaSlots";

interface ImageSectionProps {
  mediaSlot: MediaSlot;
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
  reverse?: boolean;
}

export function ImageSection({
  mediaSlot,
  eyebrow,
  title,
  body,
  bullets,
  reverse,
}: ImageSectionProps) {
  const media = getMediaBySlot(mediaSlot);

  return (
    <section className="bg-slate-900 text-white">
      <div
        className={`mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        } md:items-center`}
      >
        <div className="flex-1 space-y-2 text-[11px] md:text-[12px]">
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-orange-400">
              {eyebrow}
            </p>
          )}
          <h2 className="text-sm font-semibold md:text-base">{title}</h2>
          <p className="text-slate-300">{body}</p>
          {bullets && bullets.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-200">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
        {media && (
          <div className="relative h-44 w-full flex-1 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 md:h-56">
            <Image
              src={media.imageSrc}
              alt={media.alt}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
        )}
      </div>
    </section>
  );
}
