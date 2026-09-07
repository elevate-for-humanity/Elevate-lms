export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createWorkforceParticipant } from '../actions';

export const metadata: Metadata = {
  title: 'New Participant | Workforce | Admin | Elevate For Humanity',
};

export default async function NewParticipantPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();
  const [{ data: programs }, { data: caseWorkers }] = await Promise.all([
    db.from('programs').select('id,title').eq('is_active', true).order('title').limit(200),
    db.from('profiles').select('id,full_name,email,role').in('role', ['admin', 'staff', 'advisor']).order('full_name').limit(200),
  ]);
  const error = (await searchParams).error;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/workforce/participants"
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Participants
        </Link>
        <h1 className="text-3xl font-bold">Add New Participant</h1>
        <p className="text-gray-600 mt-1">Register a new workforce development participant</p>
      </div>

      {error ? <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 font-semibold text-red-800">{{
        'missing-fields': 'Name, email, program, and enrollment date are required.',
        'invalid-program': 'Choose an active program.',
        'invalid-case-worker': 'Choose a current case manager.',
        'create-failed': 'The participant could not be created.',
      }[error] || 'The participant could not be created.'}</p> : null}
      <form action={createWorkforceParticipant} className="bg-white rounded-lg border p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              name="email"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program *</label>
            <select
              name="program_id"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select program</option>
              {(programs || []).map((program: any) => <option key={program.id} value={program.id}>{program.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Date</label>
            <input
              type="date"
              name="enrollment_date"
              required
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Case Manager</label>
            <select name="case_worker_id" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="">Unassigned</option>{(caseWorkers || []).map((worker: any) => <option key={worker.id} value={worker.id}>{worker.full_name || worker.email} · {worker.role}</option>)}</select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            href="/workforce/participants"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Participant
          </button>
        </div>
      </form>
    </div>
  );
}
