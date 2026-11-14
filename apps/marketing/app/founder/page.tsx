import { permanentRedirect } from 'next/navigation';

export default function LegacyPage() {
  permanentRedirect('/about/elizabeth-greene');
}
