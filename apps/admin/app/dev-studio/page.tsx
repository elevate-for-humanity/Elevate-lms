import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Legacy entry point. The Admin container serves Dev Studio at /studio. */
export default function DevStudioLegacyEntry() {
  redirect('/studio');
}
