'use client';

import { Play } from 'lucide-react';
import React from 'react';

type VideoContentProps = {
  title: string;
  description?: string;
  durationLabel?: string; // e.g., "30–45 sec"
  page?: string; // optional: for analytics/tagging
};

export function VideoContent({
  title,
  description,
  durationLabel = 'Video Available Now',
}: VideoContentProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
          <Play className="h-10 w-10 text-black" />
        </div>
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-black">{title}</h3>
          {description && <p className="mt-1 text-sm text-black">{description}</p>}
          <p className="mt-2 inline-flex items-center rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-500 border border-slate-200">
            {durationLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VideoContent;
