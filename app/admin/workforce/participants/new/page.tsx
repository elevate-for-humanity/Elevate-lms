import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'New Participant | Workforce | Admin | Elevate For Humanity',
};

export default async function NewParticipantPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Participant</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">New participant form coming soon.</p>
      </div>
    </div>
  );
}
