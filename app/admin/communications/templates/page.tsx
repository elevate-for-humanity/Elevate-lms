import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'Templates | Communications | Admin | Elevate For Humanity',
};

export default async function TemplatesPage() {
  await requireRole(['admin', 'super_admin']);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Email Templates</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Template management coming soon.</p>
      </div>
    </div>
  );
}
