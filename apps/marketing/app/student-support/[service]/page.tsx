import { notFound, permanentRedirect } from 'next/navigation';
import { studentSupportTopicHref } from '@/lib/navigation/student-support';

export default async function LegacySupportTopic({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  const destination = studentSupportTopicHref(service);
  if (!destination) notFound();
  permanentRedirect(destination);
}
