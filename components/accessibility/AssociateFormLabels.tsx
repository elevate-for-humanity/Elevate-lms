'use client';

import { useEffect } from 'react';

/**
 * Backstop for legacy forms that render a visible sibling <label> without an
 * explicit htmlFor/id pair. New forms should still use native associations in
 * source. This helper repairs existing controls after hydration and whenever a
 * multi-step form mounts a new set of fields.
 */
export function AssociateFormLabels() {
  useEffect(() => {
    let sequence = 0;

    const associate = () => {
      const controls = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([type="hidden"]), select, textarea',
      );

      controls.forEach((control) => {
        if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return;
        if (control.labels && control.labels.length > 0) return;

        const wrappingLabel = control.closest('label');
        if (wrappingLabel) return;

        const parent = control.parentElement;
        const visibleLabel = parent?.querySelector(':scope > label') as HTMLLabelElement | null;
        if (!visibleLabel) return;

        if (!control.id) {
          const base = (control.getAttribute('name') || 'field')
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'field';
          sequence += 1;
          control.id = `efh-${base}-${sequence}`;
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
