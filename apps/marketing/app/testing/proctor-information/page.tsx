import { permanentRedirect } from 'next/navigation';

export default function LegacyTestingEntry() {
  permanentRedirect('/testing#policies');
}
