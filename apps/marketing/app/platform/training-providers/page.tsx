import { permanentRedirect } from 'next/navigation';

export default function TrainingProviderLegacyPage() {
  permanentRedirect('/platform/providers');
}
