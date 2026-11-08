'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import type { NavSection } from '@/lib/navigation/navigation-config';

type Step = { label: string; detail: string; element: HTMLElement | null };

function instruction(label: string, kind: string): string {
  if (kind === 'input' || kind === 'textarea' || kind === 'select')
    return 'Enter or choose the information requested here. Check every entry before submitting.';
  if (/sign|submit|save|approve|publish|delete|send|pay/i.test(label))
    return 'This action can change a real record. Review the details before you use it. This walkthrough will not submit anything.';
  if (kind === 'button') return 'Select this control to open the relevant option. This demonstration does not press it for you.';
  return 'Open this section to see the actual records or instructions for your authorized workspace.';
}

function visible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.display !== 'none';
}

/**
 * Narrates and highlights the user's REAL page controls; never uses fabricated
 * screenshots or clicks, signs, or submits on their behalf.
 * Recorded screen-video files are separate assets and must not be represented
 * as present unless an actual verified recording is provided.
 */
export function NarratedTabWalkthrough({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();
  const voice = useNaturalVoice();
  const { play: playVoice, stop: stopVoice } = voice;
  const generation = useRef(0);
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [step, setStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const tab = useMemo(() => sections.flatMap(section => section.items)
    .filter(item => {
      try {
        const path = new URL(item.href, 'https://local.invalid').pathname;
        return pathname === path || (path !== '/' && pathname.startsWith(path + '/'));
      } catch { return false; }
    })
    .sort((a, b) => new URL(b.href, 'https://local.invalid').pathname.length -
      new URL(a.href, 'https://local.invalid').pathname.length)[0], [sections, pathname]);

  function stop() {
    generation.current += 1;
    stopVoice();
    setSpeaking(false);
  }

  useEffect(() => { stop(); setOpen(false); setSteps([]); setStep(0); }, [pathname]);
  useEffect(() => () => { generation.current += 1; stopVoice(); }, [stopVoice]);

  function start() {
    stop();
    // Only actual, visible content controls. Exclude the global navigation,
    // help overlay and anything hidden behind an expandable element.
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(
      'main a[href], main button, main input:not([type="hidden"]), main select, main textarea, main summary'
    )).filter(element => !element.closest('[data-tab-walkthrough]') &&
      !element.closest('[hidden]') && visible(element));
    const unique = new Set<string>();
    const available: Step[] = [];
    for (const element of candidates) {
      const raw = element.getAttribute('aria-label') || element.getAttribute('placeholder') ||
        element.closest('label')?.textContent || element.textContent || '';
      const label = raw.trim().replace(/\s+/g, ' ').slice(0, 90);
      if (label.length < 3 || unique.has(label.toLowerCase())) continue;
      unique.add(label.toLowerCase());
      available.push({
        label,
        detail: instruction(label, element.tagName.toLowerCase()),
        element,
      });
      if (available.length >= 6) break;
    }
    const title = tab?.label || 'this dashboard tab';
    setSteps([
      { label: 'Welcome to ' + title, detail: 'Follow this short guided tour of the actual page. You can pause or replay any step. Nothing will be submitted.', element: null },
      ...available,
      { label: 'Ready to work', detail: 'You can now use the controls yourself. Return here whenever you want this tour again.', element: null },
    ]);
    setStep(0);
    setOpen(true);
  }

  const current = steps[step];
  useEffect(() => {
    if (!open || !current?.element) return;
    const element = current.element;
    const previousOutline = element.style.outline;
    const previousOffset = element.style.outlineOffset;
    element.style.outline = '3px solid #2563eb';
    element.style.outlineOffset = '3px';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return () => {
      element.style.outline = previousOutline;
      element.style.outlineOffset = previousOffset;
    };
  }, [open, current]);

  function narrate() {
    if (!current) return;
    stop();
    const ticket = generation.current;
    setSpeaking(true);
    void playVoice(current.label + '. ' + current.detail, {
      style: 'instructor',
      onEnded: () => { if (ticket === generation.current) setSpeaking(false); },
      onError: () => { if (ticket === generation.current) setSpeaking(false); },
      onPlaybackBlocked: () => { if (ticket === generation.current) setSpeaking(false); },
    });
  }

  function move(next: number) {
    stop();
    setStep(Math.max(0, Math.min(steps.length - 1, next)));
  }

  return (
    <div data-tab-walkthrough className="mx-auto w-full min-w-0 max-w-6xl px-3 py-2 sm:px-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 shadow-sm">
        <p className="min-w-0 text-sm font-semibold text-slate-800">
          {tab?.label || 'Dashboard'} <span className="hidden text-slate-500 sm:inline">· Guided training</span>
        </p>
        <button type="button" onClick={open ? () => { stop(); setOpen(false); } : start}
          className="min-h-10 shrink-0 rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white">
          {open ? 'Close guide' : 'Show me this tab'}
        </button>
      </div>
      {open && current ? (
        <section role="region" aria-label="Narrated dashboard walkthrough"
          className="mt-2 min-w-0 rounded-xl border border-blue-200 bg-blue-50 p-3 shadow-sm sm:p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-900">
            Step {step + 1} of {steps.length} · Live screen demonstration
          </p>
          <h2 className="mt-1 text-base font-bold text-slate-950">{current.label}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-800">{current.detail}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={speaking ? stop : narrate}
              className="min-h-11 rounded-lg bg-blue-800 px-3 text-sm font-semibold text-white">
              {speaking ? 'Stop narration' : 'Listen to this step'}
            </button>
            <button type="button" onClick={() => move(step - 1)} disabled={step === 0}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold disabled:opacity-40">Previous</button>
            <button type="button" onClick={() => move(step + 1)} disabled={step === steps.length - 1}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold disabled:opacity-40">Next</button>
          </div>
          <p className="mt-2 text-xs text-slate-600">This tour highlights real buttons and forms. It never edits records or signs for you.</p>
        </section>
      ) : null}
    </div>
  );
}
