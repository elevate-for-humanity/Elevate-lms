import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Legacy course-preview URL retained only for compatibility.
 * HVAC program content, pricing, media, CTAs, and application routing are
 * owned by the canonical program page so they cannot drift independently.
 */
export default function HVACCoursePreviewPage() {
  redirect('/programs/hvac-technician');
}
