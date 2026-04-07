import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeployClient from './DeployClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/copilot/deploy',
  },
  title: 'Deploy AI Copilot | Elevate For Humanity',
  description: 'Deploy and configure AI copilot features for your platform.',
};

export default async function DeployCopilotPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/copilot" className="hover:text-primary">Copilot</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Deploy</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Deploy AI Copilot</h1>
          <p className="text-gray-600 mt-2">Choose and configure AI features for your platform</p>
        </div>

        {/* Client Component handles all interactive deployment */}
        <DeployClient />
      </div>
    </div>
  );
}
