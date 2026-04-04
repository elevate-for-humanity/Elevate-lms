import AdminClientPage from '@/components/admin/AdminClientPage';
import AIStudioClient from './AIStudioClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <AdminClientPage>
      <AIStudioClient />
    </AdminClientPage>
  );
}
