import { permanentRedirect } from 'next/navigation';

export default function LegacyLmsDashboard() {
  permanentRedirect('/learner/dashboard');
}
