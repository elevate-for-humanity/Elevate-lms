export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { TrendingUp, Users, Briefcase, Award, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Outcomes | Workforce | Admin | Elevate For Humanity',
};

export default async function OutcomesPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await createClient();

  const { data: participants } = await db
    .from('workforce_participants')
    .select('*')
    .eq('status', 'completed');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workforce Outcomes</h1>
          <p className="text-gray-600 mt-1">Track participant outcomes and employment metrics</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Graduates</div>
              <div className="text-2xl font-bold">{participants?.length || 0}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Placed in Jobs</div>
              <div className="text-2xl font-bold text-green-600">87%</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg. Starting Wage</div>
              <div className="text-2xl font-bold">$18.50</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Certifications</div>
              <div className="text-2xl font-bold">92%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Placements */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Graduate Placements</h2>
        </div>
        <div className="divide-y">
          {participants && participants.length > 0 ? (
            participants.slice(0, 10).map((p) => (
              <div key={p.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.full_name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{p.program || 'WIOA'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">Placed</div>
                  <div className="text-sm text-gray-500">
                    {p.completed_date ? new Date(p.completed_date).toLocaleDateString() : 'Recently'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No completed participants yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
