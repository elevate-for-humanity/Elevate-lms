import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createCommunicationTemplate } from '../actions';

export const metadata: Metadata = {
  title: 'New Template | Communications',
  description: 'Create a new communication template.',
};

const errors: Record<string, string> = {
  'invalid-key': 'Use 3–80 lowercase letters, numbers, dots, dashes, or underscores for the key.',
  'missing-content': 'Subject and plain-text body are required.',
  'duplicate-key': 'A template with this key already exists for this tenant.',
  'create-failed': 'The template could not be saved. Try again or check system health.',
};

export default async function NewTemplatePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole(['admin', 'super_admin']);
  const errorKey = (await searchParams).error || '';
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <Link href="/communications/templates" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Back to templates
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">New Communication Template</h1>
      <p className="mt-1 text-slate-600">Create a reusable tenant-aware email template backed by production data.</p>
      {errors[errorKey] ? <p role="alert" className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 font-semibold text-red-800">{errors[errorKey]}</p> : null}
      <form action={createCommunicationTemplate} className="mt-6 space-y-5 rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <label className="block"><span className="text-sm font-bold text-slate-800">Template key</span><input name="key" required minLength={3} maxLength={80} pattern="[a-z0-9][a-z0-9._-]{2,79}" placeholder="enrollment-approved" className="mt-1 w-full rounded-lg border px-3 py-2 text-slate-950" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-800">Subject</span><input name="subject" required maxLength={200} placeholder="Your enrollment was approved" className="mt-1 w-full rounded-lg border px-3 py-2 text-slate-950" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-800">Plain-text body</span><textarea name="body" required rows={8} placeholder="Hello {{first_name}}, ..." className="mt-1 w-full rounded-lg border px-3 py-2 text-slate-950" /></label>
        <label className="block"><span className="text-sm font-bold text-slate-800">HTML body (optional)</span><textarea name="html" rows={8} placeholder="<p>Hello {{first_name}}, ...</p>" className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm text-slate-950" /></label>
        <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 font-bold text-white hover:bg-blue-800"><Save className="h-4 w-4" /> Save template</button>
      </form>
    </div>
  );
}
