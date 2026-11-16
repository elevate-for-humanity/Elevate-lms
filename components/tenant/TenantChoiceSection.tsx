'use client';

import { useId, useState } from 'react';
import { TenantTrackedLink } from './TenantSiteClientOps';
import { tenantSiteHref } from '@/lib/tenant/site-links';

type Content = Record<string, unknown>;
const text = (value: unknown) => typeof value === 'string' ? value : '';

// A choice changes local explanatory content. Only an explicit link navigates;
// it uses the same tracking and read-only boundary as other tenant actions.
export function TenantChoiceSection({ content, primary, basePath = '' }: {
  content: Content; primary: string; basePath?: string;
}) {
  const id = useId();
  const [selection, setSelection] = useState(0);
  const items = Array.isArray(content.items)
    ? content.items.filter((item): item is Content => Boolean(item) && typeof item === 'object' && !Array.isArray(item) && Boolean(text(item.label))).slice(0, 12)
    : [];
  const selected = items[selection] || items[0];

  function action(href: unknown, label: unknown, className: string) {
    const value = text(href).trim();
    if (!text(label) || !/^(?:\/(?![\\/])|#|https?:\/\/|mailto:|tel:)/i.test(value)) return null;
    return <TenantTrackedLink href={tenantSiteHref(value, basePath)} eventName="cta_click" external={/^https?:\/\//i.test(value)} className={className}>{text(label)}</TenantTrackedLink>;
  }

  return <section className="tenant-choice-section px-5 py-16 sm:px-6" aria-labelledby={`${id}-title`}>
    <div className="mx-auto max-w-7xl">
      {text(content.eyebrow) ? <p className="text-sm font-bold uppercase tracking-[.2em]">{text(content.eyebrow)}</p> : null}
      <h2 id={`${id}-title`} className="mt-4 max-w-4xl text-3xl font-black sm:text-5xl">{text(content.title)}</h2>
      {text(content.text) ? <p className="mt-6 max-w-2xl text-lg leading-8">{text(content.text)}</p> : null}
      {selected ? <div className="mt-8 max-w-4xl">
        <fieldset>
          <legend className="font-bold">{text(content.choicesLabel) || 'Choose your priority'}</legend>
          <div className="mt-4 flex flex-wrap gap-3">{items.map((item, index) => <label key={index} className="relative cursor-pointer">
            <input className="peer sr-only" type="radio" name={`${id}-choice`} checked={selected === item} onChange={() => setSelection(index)} aria-controls={`${id}-detail`} />
            <span className="inline-flex min-h-12 items-center rounded-full border px-5 py-3 font-bold peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2" style={{ borderColor: primary, backgroundColor: selected === item ? primary : 'transparent', color: selected === item ? '#ffffff' : 'inherit' }}>{text(item.label)}</span>
          </label>)}</div>
        </fieldset>
        <div id={`${id}-detail`} aria-live="polite" aria-atomic="true" className="mt-6 max-w-2xl border-l-2 pl-5" style={{ borderColor: primary }}>
          <p className="text-lg leading-8">{text(selected.description)}</p>
          {action(selected.href, text(selected.buttonText) || text(content.choiceButtonText) || 'Explore this option', 'mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4')}
        </div>
      </div> : null}
      <div className="mt-8 flex flex-wrap gap-4">
        {action(content.buttonHref, content.buttonText, 'inline-flex min-h-12 items-center rounded-full border px-7 py-4 font-bold')}
        {action(content.secondaryButtonHref, content.secondaryButtonText, 'inline-flex min-h-12 items-center px-3 py-3 font-bold underline underline-offset-4')}
      </div>
    </div>
  </section>;
}
