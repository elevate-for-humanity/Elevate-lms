import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Add JRI Participant | Elevate For Humanity',
};

export default async function NewJRIParticipantPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/jri/participants/new');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  // Fetch students to link to
  const { data: students } = await db
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'student')
    .order('full_name')
    .limit(200);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Job Ready Indy', href: '/admin/jri' },
            { label: 'Participants', href: '/admin/jri/participants' },
            { label: 'New' },
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add JRI Participant</h1>
        </div>

        <form action="/api/admin/jri/participants" method="POST" className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select name="user_id" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="">Select a student…</option>
              {(students || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
            <select name="program" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="">Select a program…</option>
              <option value="HVAC Technician">HVAC Technician</option>
              <option value="Electrical Apprenticeship">Electrical Apprenticeship</option>
              <option value="Plumbing Apprenticeship">Plumbing Apprenticeship</option>
              <option value="CDL Commercial Driving">CDL Commercial Driving</option>
              <option value="Welding Certification">Welding Certification</option>
              <option value="CNA Training">CNA Training</option>
              <option value="IT Support Specialist">IT Support Specialist</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Business Office Administration">Business Office Administration</option>
              <option value="Tax Preparation">Tax Preparation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Date</label>
            <input type="date" name="enrolled_at" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
            <select name="employment_status" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="unemployed">Unemployed</option>
              <option value="employed">Employed</option>
              <option value="training">In Training</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-brand-blue-600 text-white px-5 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
              Add Participant
            </button>
            <Link href="/admin/jri/participants" className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
