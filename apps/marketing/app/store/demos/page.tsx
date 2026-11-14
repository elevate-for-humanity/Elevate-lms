import { permanentRedirect } from 'next/navigation';
export default function LegacyDemoIndex() {
  permanentRedirect('/store/demo');
}
