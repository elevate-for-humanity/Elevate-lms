/**
 * CanonicalHero — the standard hero layout for all marketing and program pages.
 *
 * Rules (non-negotiable):
 *   - Media renders first, in its own block
 *   - Title, body, and CTAs render BELOW the media — never on top of it
 *   - No overlay props, no z-index stacking, no absolute positioning of text
 *   - Pass media via the `media` prop — use HeroMediaFrame to wrap it
 *
 * Usage:
 *   <CanonicalHero
 *     media={<HeroMediaFrame><CanonicalVideo src="..." poster="..." className="aspect-video w-full object-cover" /></HeroMediaFrame>}
 *     title="Page Title"
 *     body="Supporting copy goes here."
 *     actions={<><Link href="/apply">Apply Now</Link></>}
 *   />
 */

import type { ReactNode } from 'react';

type Props = {
  media: ReactNode;
  title: string;
  body?: string;
  actions?: ReactNode;
  className?: string;
};

export default function CanonicalHero({
  media,
  title,
  body,
  actions,
  className = '',
}: Props) {
  return (
    <section className={`w-full ${className}`}>
      {/* Media block — full width, no text inside */}
      <div>{media}</div>

      {/* Content block — always below media */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl leading-tight">
          {title}
        </h1>

        {body ? (
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg max-w-2xl">
            {body}
          </p>
        ) : null}

        {actions ? (
          <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
