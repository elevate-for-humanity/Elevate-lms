import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Participants | Workforce | Admin | Elevate For Humanity',
};

export default async function ParticipantsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workforce Participants</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Participant list coming soon.</p>
      </div>
    </div>
  );
}
