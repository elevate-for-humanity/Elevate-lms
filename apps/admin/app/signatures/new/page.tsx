import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileSignature } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'New Signature Request | Admin' };

async function createSignatureRequest(formData: FormData) {
  'use server';
  const db = await requireAdminClient();
  // Create a signature document first, then a pending signature row
  const { data: doc, error: docErr } = await db
    .from('signature_documents')
    .insert({
      title: formData.get('title') as string,
      type: (formData.get('type') as string) || 'consent',
    })
    .select('id')
    .single();
  if (docErr || !doc) return;

  await db.from('signatures').insert({
    document_id: doc.id,
    signer_name: formData.get('signer_name') as string,
    signer_email: formData.get('signer_email') as string,
    role: (formData.get('role') as string) || 'participant',
    status: 'pending',
  });
  redirect('/admin/signatures');
}

export default async function NewSignaturePage() {
  await requireRole(['admin', 'staff']);
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-xl mx-auto">
        <Link href="/admin/signatures" className="inline-flex items-center gap-1 text-sm text-brand-blue-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Signatures
        </Link>
        <div className="flex items-center gap-2 mb-6">
          <FileSignature className="w-5 h-5 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">New Signature Request</h1>
        </div>
        <form action={createSignatureRequest} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document Title <span className="text-rose-500">*</span></label>
            <input name="title" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g. Enrollment Agreement" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
            <select name="type" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="consent">Consent Form</option>
              <option value="enrollment">Enrollment Agreement</option>
              <option value="mou">MOU</option>
              <option value="release">Release</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Signer Name <span className="text-rose-500">*</span></label>
            <input name="signer_name" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Signer Email <span className="text-rose-500">*</span></label>
            <input name="signer_email" type="email" required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select name="role" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
              <option value="participant">Participant</option>
              <option value="guardian">Guardian</option>
              <option value="employer">Employer</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Link href="/admin/signatures" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">Send Request</button>
          </div>
        </form>
      </div>
    </div>
  );
}
