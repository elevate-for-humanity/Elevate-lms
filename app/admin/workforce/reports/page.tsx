import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Reports | Workforce | Admin | Elevate For Humanity',
};

export default async function ReportsPage() {
  await requireRole(['admin', 'super_admin']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workforce Reports</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Report generation coming soon.</p>
      </div>
    </div>
  );
}
