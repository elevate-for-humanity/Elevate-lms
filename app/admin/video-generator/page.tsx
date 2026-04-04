import AdminClientPage from '@/components/admin/AdminClientPage';
import VideoGeneratorClient from './VideoGeneratorClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <AdminClientPage>
      <VideoGeneratorClient />
    </AdminClientPage>
  );
}
