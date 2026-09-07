export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, Plus, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Participants | Workforce | Admin | Elevate For Humanity',
};

export default async function ParticipantsPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();

  const { data: participants } = await db
    .from('workforce_participants')
    .select('id,name,email,program_id,status,enrollment_date,created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  const programIds = [...new Set((participants || []).map((participant) => participant.program_id).filter(Boolean))];
  const { data: programs } = programIds.length
    ? await db.from('programs').select('id,title').in('id', programIds)
    : { data: [] };
  const programNames = new Map((programs || []).map((program) => [program.id, program.title]));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workforce Participants</h1>
          <p className="text-gray-600 mt-1">Manage workforce development program participants</p>
        </div>
        <Link
          href="/workforce/participants/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Participant
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Total Participants</div>
          <div className="text-2xl font-bold">{participants?.length || 0}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {participants?.filter(p => p.status === 'active').length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-blue-600">
            {participants?.filter(p => p.status === 'completed').length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">In Training</div>
          <div className="text-2xl font-bold text-purple-600">
            {participants?.filter(p => p.status === 'training').length || 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Program</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Enrolled</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Progress</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {participants && participants.length > 0 ? (
              participants.map((participant) => (
                <tr key={participant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{participant.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{participant.email || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {participant.program_id
                        ? programNames.get(participant.program_id) || 'Program record unavailable'
                        : 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      participant.status === 'active' ? 'bg-green-100 text-green-700' :
                      participant.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {participant.status || 'Unspecified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {participant.enrollment_date ? new Date(participant.enrollment_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">Not tracked on this record</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/workforce/participants/${participant.id}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p>No participants found</p>
                  <Link
                    href="/workforce/participants/new"
                    className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
                  >
                    Add your first participant
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
