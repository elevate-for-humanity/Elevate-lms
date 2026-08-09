import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Compatibility route only. The public employer overview lives at /employers;
// hiring-specific discovery lives at /hire-graduates, and authenticated employer
// operations live on the LMS service.
export default function EmployerRootRedirect() {
  permanentRedirect('/employers');
}
