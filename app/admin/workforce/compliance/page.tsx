import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Compliance | Workforce | Admin | Elevate For Humanity',
};

export default async function CompliancePage() {
  await requireRole(['admin', 'super_admin']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workforce Compliance</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Compliance checklist coming soon.</p>
      </div>
    </div>
  );
}
