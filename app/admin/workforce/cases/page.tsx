import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Cases | Workforce | Admin | Elevate For Humanity',
};

export default async function CasesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workforce Cases</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Case management coming soon.</p>
      </div>
    </div>
  );
}
