'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { subscriptionCommercial } from '@/lib/store/subscription-commercials';
import type {
  IndividualAppCatalog,
  IndividualPlanDefinition,
} from '@/lib/apps/individual-app-plans';
export default function SubscriptionCommercialPlayer({
  catalog,
  plan,
}: {
  catalog: IndividualAppCatalog;
  plan: IndividualPlanDefinition;
}) {
  const commercial = subscriptionCommercial(catalog, plan),
    [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [catalog.slug, plan.id]);
  if (!commercial)
    return (
      <div className="relative mt-6 aspect-[21/8] overflow-hidden rounded-2xl">
        <Image
          src={`/images/store-commercials/${catalog.slug}.webp`}
          alt={`Illustrative scene for ${catalog.displayName} business owners`}
          fill
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
          priority
        />
      </div>
    );
  return (
    <section
      className="mt-6 overflow-hidden rounded-2xl border bg-white"
      aria-label={`${catalog.displayName} ${plan.name} commercial`}
    >
      <video
        key={commercial.src}
        controls
        playsInline
        preload="none"
        poster={commercial.poster}
        className="aspect-video w-full bg-black object-contain"
        onError={() => setFailed(true)}
      >
        <source src={commercial.src} type="video/mp4" />
        <track
          kind="captions"
          src={commercial.captions}
          srcLang="en"
          label="English narration"
          default
        />
      </video>
      <div className="p-4">
        <p className="text-sm">
          {catalog.displayName} · {plan.name} · {plan.priceLabel} — narrated commercial with
          illustrative scenes and actual demo screens.
        </p>
        {failed ? (
          <p role="status" className="mt-3 text-sm">
            The video could not load. You can hear the plan and try the workspace controls below.
          </p>
        ) : null}
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-bold">Read the commercial transcript</summary>
          <p className="mt-3 whitespace-pre-line leading-7">{commercial.transcript}</p>
        </details>
      </div>
    </section>
  );
}
