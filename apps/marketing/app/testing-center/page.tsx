import { permanentRedirect } from 'next/navigation';

export default function LegacyTestingCenterPage() {
  permanentRedirect('/testing');
}
