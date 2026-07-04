import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Outcomes | Workforce | Admin | Elevate For Humanity',
};

export default async function OutcomesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workforce Outcomes</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Outcome tracking coming soon.</p>
      </div>
    </div>
  );
}
