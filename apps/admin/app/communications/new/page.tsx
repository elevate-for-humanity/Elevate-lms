export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { sendCommunication } from './actions';

export const metadata: Metadata = {
  title: 'New Message | Communications | Admin | Elevate For Humanity',
};

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const { data: templates } = await db
    .from('email_templates')
    .select('id,key,subject')
    .limit(20);
  const error = (await searchParams).error;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/communications"
          className="text-gray-500 hover:text-gray-700 flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Communications
        </Link>
        <h1 className="text-3xl font-bold">Compose New Message</h1>
        <p className="text-gray-600 mt-1">Send an email to explicitly named recipients</p>
      </div>

      {error ? <p role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 font-semibold text-red-800">{{
        'invalid-recipients': 'Enter 1–25 valid recipient email addresses.',
        'invalid-template': 'Choose an available template.',
        'missing-content': 'A subject and message are required.',
      }[error] || 'The message could not be sent.'}</p> : null}
      <form action={sendCommunication} className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients *</label>
          <textarea name="recipients" required rows={3} placeholder="name@example.com, another@example.com" className="mb-4 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="mb-4 text-xs text-gray-500">Enter up to 25 addresses, separated by commas or new lines. Messages are recorded individually.</p>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
          <select name="template_id" className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select template (optional)</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>{t.key} — {t.subject}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            name="subject"
            placeholder="Enter email subject..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            rows={10}
            name="message"
            placeholder="Write your message here..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send to Named Recipients
          </button>
        </div>
      </form>
    </div>
  );
}
