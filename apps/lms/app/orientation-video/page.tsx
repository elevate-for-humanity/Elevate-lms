import { permanentRedirect } from 'next/navigation';

export default function LegacyOrientationVideoPage() {
  permanentRedirect('/lms/orientation');
}
