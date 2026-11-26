'use client';

import { useEffect } from 'react';

/**
 * Backstop for legacy forms that render a visible sibling <label> without an
 * explicit htmlFor/id pair. New forms should still use native associations in
 * source. This helper repairs existing controls after hydration and whenever a
 * multi-step form mounts a new set of fields.
 */
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'field'
  );
}

export function AssociateFormLabels() {
  useEffect(() => {
    const associate = () => {
      const controls = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]), select, textarea',
      );

      // Ids are derived from the control itself (label text, then name), with
      // the disambiguating suffix counted fresh from DOM order on every pass.
      // The old run-local counter kept incrementing across re-associations
      // (React re-renders strip the foreign id, the observer re-runs, the
      // counter grows), so the same control got efh-field-1, then -3, then
      // -5 ... while its label's htmlFor still pointed at the stale id —
      // the /testing hydration churn (efh-field-1/2). A derived id is the
      // same on every pass, so re-association is a no-op.
      const used = new Map<string, number>();
      controls.forEach((control) => {
        if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return;
        if (control.labels && control.labels.length > 0) return;

        const wrappingLabel = control.closest('label');
        if (wrappingLabel) return;

        const parent = control.parentElement;
        const visibleLabel = parent?.querySelector(':scope > label') as HTMLLabelElement | null;
        if (!visibleLabel) return;

        if (!control.id) {
          const base = `efh-${slugify(visibleLabel.textContent ?? '') || slugify(control.getAttribute('name') ?? '')}`;
          // A sibling may already own the bare base id (e.g. it kept its id
          // from an earlier pass while this control's was stripped), so
          // probe the live DOM instead of trusting the per-pass counter.
          let count = used.get(base) ?? 0;
          let candidate = base;
          while (document.getElementById(candidate) && document.getElementById(candidate) !== control) {
            count += 1;
            candidate = `${base}-${count}`;
          }
          used.set(base, count);
          control.id = candidate;
        }
        visibleLabel.htmlFor = control.id;
      });
    };

    associate();
    const observer = new MutationObserver(associate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
