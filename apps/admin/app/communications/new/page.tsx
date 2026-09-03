export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Send, Users, User, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Message | Communications | Admin | Elevate For Humanity',
};

export default async function NewMessagePage() {
  await requireRole(['admin', 'super_admin']);
  const db = await createClient();

  const { data: templates } = await db
    .from('email_templates')
    .select('id, name, type')
    .limit(20);

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
        <p className="text-gray-600 mt-1">Send email or SMS to students and participants</p>
      </div>

      <form className="bg-white rounded-lg border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
          <div className="flex gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="recipient_type" value="all" defaultChecked className="w-4 h-4" />
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">All Students</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="recipient_type" value="specific" className="w-4 h-4" />
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Specific Recipients</span>
            </label>
          </div>
          <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select template (optional)</option>
            {templates?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            placeholder="Enter email subject..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            rows={10}
            placeholder="Write your message here..."
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </form>
    </div>
  );
}
