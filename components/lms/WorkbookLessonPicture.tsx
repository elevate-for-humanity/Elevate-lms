'use client';
import { useState } from 'react';
import type { WorkbookVisual } from '@/lib/lms/workbook-visuals';

/** Preserve the entire instructional frame; never crop, tint, or substitute a generic photo. */
export default function WorkbookLessonPicture({ visual }: { visual: WorkbookVisual }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="overflow-hidden rounded-xl border border-stone-600 bg-stone-900">
      {failed ? (
        <p role="status" className="p-5 text-white">
          This lesson picture could not load. Reload the workbook to retry; your saved answers
          remain in your account.
        </p>
      ) : (
        <img
          src={visual.src}
          alt={visual.alt}
          loading="lazy"
          width={1536}
          height={1024}
          onError={() => setFailed(true)}
          className="block h-auto max-h-[32rem] w-full object-contain"
        />
      )}
      <figcaption className="space-y-2 p-4 text-base leading-relaxed text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
          {visual.generated ? 'Illustrative training image · AI-generated' : 'Training example'}
        </p>
        <p>{visual.caption}</p>
      </figcaption>
    </figure>
  );
}
