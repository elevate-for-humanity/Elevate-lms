import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';

export const metadata: Metadata = {
  title: 'New Message | Communications | Admin | Elevate For Humanity',
};

export default async function NewMessagePage() {
  await requireRole(['admin', 'super_admin']);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Compose New Message</h1>
      <div className="bg-white rounded-lg border p-6">
        <p className="text-gray-600">Message composition form coming soon.</p>
        <p className="text-sm text-gray-500 mt-2">Configure email/SMS provider in settings.</p>
      </div>
    </div>
  );
}
