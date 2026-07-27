export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compliance | Workforce | Admin | Elevate For Humanity',
};

export default async function CompliancePage() {
  await requireRole(['admin', 'super_admin']);
  const db = await createClient();

  const { data: participants } = await db
    .from('workforce_participants')
    .select('*');

  const compliant = participants?.filter(p => p.compliance_status === 'compliant').length || 0;
  const pending = participants?.filter(p => p.compliance_status === 'pending').length || 0;
  const overdue = participants?.filter(p => p.compliance_status === 'overdue').length || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workforce Compliance</h1>
        <p className="text-gray-600 mt-1">Track and manage participant compliance requirements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Compliant</div>
              <div className="text-2xl font-bold text-green-600">{compliant}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Pending Review</div>
              <div className="text-2xl font-bold text-amber-600">{pending}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Overdue</div>
              <div className="text-2xl font-bold text-red-600">{overdue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Required Documentation Checklist</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>WIOA Individualized Employment Plan (IEP)</span>
            </div>
            <span className="text-sm text-gray-500">Required</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>Eligibility Verification Documentation</span>
            </div>
            <span className="text-sm text-gray-500">Required</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>Skills Assessment Results</span>
            </div>
            <span className="text-sm text-gray-500">Required</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>Training Plan Agreement</span>
            </div>
            <span className="text-sm text-gray-500">Required</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>Progress Reports (Monthly)</span>
            </div>
            <span className="text-sm text-gray-500">Ongoing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
