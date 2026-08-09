import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Compatibility route only. Public employer discovery is maintained at
// /hire-graduates; authenticated employer operations live on the LMS service.
export default function EmployerRootRedirect() {
  permanentRedirect('/hire-graduates');
}
