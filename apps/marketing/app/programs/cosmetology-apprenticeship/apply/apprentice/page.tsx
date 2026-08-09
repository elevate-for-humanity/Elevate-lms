import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Legacy apprentice-specific application route retained only for old links.
 * The canonical student application owns apprentice intake now.
 */
export default function CosmetologyApprenticeApplyPage() {
  redirect('/apply/student?program=cosmetology-apprenticeship');
}
