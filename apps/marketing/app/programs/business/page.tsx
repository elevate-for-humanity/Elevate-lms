import { permanentRedirect } from 'next/navigation';

/**
 * Compatibility alias retained for historical business-program links.
 * Business Administration is published at the canonical slug below.
 */
export default function BusinessAliasPage() {
  permanentRedirect('/programs/business-administration');
}
