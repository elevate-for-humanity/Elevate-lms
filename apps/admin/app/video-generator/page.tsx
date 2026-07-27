import { requireRole } from '@/lib/auth/require-role';
import VideoGeneratorClient from './VideoGeneratorClient';

export { metadata } from './layout';
export const dynamic = 'force-dynamic';

export default async function Page() {
  await requireRole(['admin', 'staff']);
  return <VideoGeneratorClient />;
}
