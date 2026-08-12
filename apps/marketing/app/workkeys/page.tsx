import { permanentRedirect } from 'next/navigation';

export default function LegacyWorkKeysPage() {
  permanentRedirect('/testing/workkeys');
}
