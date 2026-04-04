import AdminClientPage from '@/components/admin/AdminClientPage';
import VideoManagerClient from './VideoManagerClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <AdminClientPage>
      <VideoManagerClient />
    </AdminClientPage>
  );
}
