import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Appointment | CRM | Admin' };

async function createAppointment(formData: FormData) {
  'use server';
  const db = await requireAdminClient();
  const { error } = await db.from('appointments').insert({
    title: formData.get('title') as string,
    contact_name: formData.get('contact_name') as string,
    scheduled_at: formData.get('scheduled_at') as string,
    notes: (formData.get('notes') as string) || null,
    status: 'scheduled',
  });
  if (!error) redirect('/admin/crm/appointments');
}

export default async function NewAppointmentPage() {
  await requireRole(['admin', 'staff']);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/crm/appointments" className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Appointments
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">New Appointment</h1>
        </div>
        <form action={createAppointment} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-rose-500">*</span></label>
            <input name="title" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. Intake call with John Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
            <input name="contact_name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time <span className="text-rose-500">*</span></label>
            <input name="scheduled_at" type="datetime-local" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/crm/appointments" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">Schedule Appointment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
