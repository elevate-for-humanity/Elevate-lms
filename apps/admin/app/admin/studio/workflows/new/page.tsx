import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** Compatibility entry only; the implementation lives at /studio/workflows/new. */
export default function LegacyNewWorkflowPage() {
  redirect('/studio/workflows/new');
}
