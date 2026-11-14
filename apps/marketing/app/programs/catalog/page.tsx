import { permanentRedirect } from 'next/navigation';

/**
 * Compatibility route for the retired parallel public program catalog.
 * The canonical public catalog is /programs.
 */
export default function ProgramsCatalogCompatibilityPage() {
  permanentRedirect('/programs');
}
