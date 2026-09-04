import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Documents have one canonical admin surface.
 * Keeping a single route prevents list/review counts and storage access rules
 * from drifting between duplicate implementations.
 */
export default function DocumentsPage() {
  redirect('/documents/review');
}
