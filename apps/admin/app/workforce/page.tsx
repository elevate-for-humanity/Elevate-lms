export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Briefcase, GraduationCap, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workforce Development | Admin | Elevate For Humanity',
};

export default async function WorkforcePage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await createClient();

  // Fetch workforce participants
  const { data: participants } = await db
    .from('workforce_participants')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  // Fetch workforce cases
  const { data: cases } = await db
    .from('workforce_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch funding sources
  const { data: funding } = await db
    .from('workforce_funding')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  // Calculate stats
  const activeParticipants = participants?.filter(p => p.status === 'active').length || 0;
  const employed = participants?.filter(p => p.employment_status === 'employed').length || 0;
  const completed = participants?.filter(p => p.status === 'completed').length || 0;
  const inTraining = participants?.filter(p => p.status === 'in_training').length || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workforce Development</h1>
          <p className="text-gray-600">Track WorkOne, VR, and grant-funded participants</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/workforce/participants/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Add Participant
          </Link>
          <Link
            href="/workforce/cases"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Cases
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeParticipants}</p>
              <p className="text-sm text-gray-600">Active Participants</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inTraining}</p>
              <p className="text-sm text-gray-600">In Training</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{employed}</p>
              <p className="text-sm text-gray-600">Employed</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completed}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Participants Table */}
        <div className="col-span-2 bg-white rounded-lg border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Participants
            </h2>
            <Link href="/workforce/participants" className="text-blue-600 hover:underline text-sm">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funding</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {participants?.length ? (
                  participants.slice(0, 10).map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{p.name || `${p.first_name} ${p.last_name}`}</p>
                        <p className="text-sm text-gray-500">{p.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{p.program || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' :
                          p.status === 'in_training' ? 'bg-blue-100 text-blue-700' :
                          p.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{p.funding_source || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/students/${p.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No participants yet</p>
                      <p className="text-sm">Add your first workforce participant</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Funding Sources */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Funding Sources
              </h2>
            </div>
            <div className="p-4">
              {funding?.length ? (
                <div className="space-y-3">
                  {funding.slice(0, 5).map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between">
                      <span className="font-medium">{f.source}</span>
                      <span className="text-green-600">${f.amount?.toLocaleString() || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center">No funding sources configured</p>
              )}
            </div>
          </div>

          {/* Active Cases */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Active Cases
              </h2>
            </div>
            <div className="divide-y">
              {cases?.length ? (
                cases.slice(0, 5).map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/workforce/cases/${c.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <p className="font-medium">{c.case_number}</p>
                    <p className="text-sm text-gray-600">{c.participant_name}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      c.status === 'open' ? 'bg-green-100 text-green-700' :
                      c.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {c.status?.toUpperCase()}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No active cases
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/workforce/reports"
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                📊 Generate Reports
              </Link>
              <Link
                href="/workforce/outcomes"
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                📈 Track Outcomes
              </Link>
              <Link
                href="/workforce/compliance"
                className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                ✅ Compliance Checklist
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
