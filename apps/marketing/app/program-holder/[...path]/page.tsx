import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { path: string[] };
}

// Legacy portal redirect mapping — catch any remaining portal/* routes not covered by explicit files
const LEGACY_PORTAL_REDIRECTS: Record<string, { destination: string; status: 307 | 308 }> = {
  'portal/students': { destination: '/program-holder/dashboard', status: 308 },
  'portal/reports': { destination: '/program-holder/dashboard', status: 308 },
  'portal/page': { destination: '/program-holder/dashboard', status: 307 },
};

export function GET({ params }: PageProps) {
  const path = (params as { path?: string[] }).path?.join('/') || '';

  // Check if this is a legacy portal redirect
  const legacyRedirect = LEGACY_PORTAL_REDIRECTS[path];
  if (legacyRedirect) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
    return NextResponse.redirect(new URL(legacyRedirect.destination, base), legacyRedirect.status);
  }

  // Return 404 for truly unmatched routes
  return notFound();
}

export default function ProgramHolderCatchAll({ params }: PageProps) {
  const path = (params as { path?: string[] }).path?.join('/') || '';

  // Check if this is a legacy portal redirect
  const legacyRedirect = LEGACY_PORTAL_REDIRECTS[path];
  if (legacyRedirect) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
    return NextResponse.redirect(new URL(legacyRedirect.destination, base), legacyRedirect.status);
  }

  // All other unmatched routes return 404
  notFound();
}
