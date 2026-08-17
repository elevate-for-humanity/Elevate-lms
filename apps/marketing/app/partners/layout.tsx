import type { ReactNode } from 'react';

/**
 * Partners route group layout.
 *
 * Visual hero content belongs to each partner page so routes can present the
 * correct program, audience, CTA, image, and metadata without inheriting a
 * second generic banner from the parent layout.
 */
export default function PartnersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
