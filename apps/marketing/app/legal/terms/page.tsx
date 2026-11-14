import { permanentRedirect } from 'next/navigation';

export default function LegacyLegalTermsPage() {
  permanentRedirect('/terms-of-service');
}
