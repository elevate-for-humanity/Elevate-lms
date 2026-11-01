'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/** Start the actual public demo inside the card, without a background media request. */
export default function InlineStoreDemo({
  name,
  href,
  poster = '/images/programs/refresh-20261101/business.webp',
}: {
  name: string;
  href: string;
  poster?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-slate-300 bg-slate-950 text-white">
      <div className="flex items-center justify-between gap-2 border-b border-white/15 px-3 py-2 text-xs font-bold">
        <span>{name} demo</span>
        <span className="text-orange-300">Interactive preview</span>
      </div>
      {open ? (
        <>
          <iframe
            src={href}
            title={`${name} interactive demonstration`}
            loading="lazy"
            className="h-96 w-full border-0 bg-white"
            allow="autoplay; fullscreen"
          />
          <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 font-bold">
              Close demo
            </button>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 py-3 font-bold underline"
            >
              Open full screen
            </Link>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block aspect-video w-full overflow-hidden text-left"
          aria-label={`Play ${name} demo`}
        >
          <Image
            src={poster}
            alt={`Illustrative ${name} product preview`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover opacity-65 transition group-hover:opacity-80"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-lg">
              ▶ Play demo
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
