export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Templates | Communications | Admin | Elevate For Humanity',
};

export default async function TemplatesPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await createClient();

  const { data: templates } = await db
    .from('email_templates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email & Message Templates</h1>
          <p className="text-gray-600 mt-1">Manage reusable communication templates</p>
        </div>
        <Link
          href="/communications/templates/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* Templates Grid */}
      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-500">Email</span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold mb-2">{template.key}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.subject || template.body?.substring(0, 100) || 'No content'}
              </p>
              <p className="text-xs text-slate-500">Tenant: {template.tenant_id ? 'organization-specific' : 'global'}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first email or message template</p>
          <Link
            href="/communications/templates/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      )}
    </div>
  );
}
