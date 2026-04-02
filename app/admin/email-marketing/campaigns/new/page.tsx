// Server component — enforces admin auth at the route boundary.
// The client component never renders for unauthorized users.
import AdminClientPage from '@/components/admin/AdminClientPage';
import NewCampaignClient from './NewCampaignClient';

export const dynamic = 'force-dynamic';

export default function Page() {{
  return (
    <AdminClientPage>
      <NewCampaignClient />
    </AdminClientPage>
  );
}}
