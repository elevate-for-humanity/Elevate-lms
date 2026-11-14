import { permanentRedirect } from 'next/navigation';

export default function LegacyMembershipPage() {
  permanentRedirect('/store');
}
