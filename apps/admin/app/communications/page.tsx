export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { MessageSquare, Mail, Phone, Bell, Send, Users, FileText, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Communications | Admin | Elevate For Humanity',
};

export default async function CommunicationsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await createClient();

  // Fetch recent communications from database
  const { data: communications } = await db
    .from('communications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch email templates
  const { data: templates } = await db
    .from('email_templates')
    .select('*')
    .limit(20);

  // Fetch scheduled messages
  const { data: scheduled } = await db
    .from('scheduled_messages')
    .select('*')
    .order('send_at', { ascending: true })
    .limit(20);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Communications Hub</h1>
          <p className="text-gray-600">Manage all communications, alerts, and messaging</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/communications/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            New Message
          </Link>
          <Link
            href="/communications/templates"
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Templates
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{communications?.length || 0}</p>
              <p className="text-sm text-gray-600">Total Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {communications?.filter((c: any) => c.type === 'email').length || 0}
              </p>
              <p className="text-sm text-gray-600">Emails</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {communications?.filter((c: any) => c.type === 'sms').length || 0}
              </p>
              <p className="text-sm text-gray-600">SMS</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{scheduled?.length || 0}</p>
              <p className="text-sm text-gray-600">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* Recent Communications */}
        <div className="col-span-2 bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Communications
            </h2>
          </div>
          <div className="divide-y">
            {communications?.length ? (
              communications.map((comm: any) => (
                <div key={comm.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        comm.type === 'email' ? 'bg-blue-100 text-blue-700' :
                        comm.type === 'sms' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {comm.type?.toUpperCase()}
                      </span>
                      <p className="mt-2 font-medium">{comm.subject || comm.title}</p>
                      <p className="text-sm text-gray-600">{comm.recipient}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(comm.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No communications yet</p>
                <p className="text-sm">Start by sending your first message</p>
              </div>
            )}
          </div>
        </div>

        {/* Templates & Scheduled */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Templates
              </h2>
            </div>
            <div className="divide-y">
              {templates?.length ? (
                templates.slice(0, 5).map((tmpl: any) => (
                  <Link
                    key={tmpl.id}
                    href={`/communications/templates/${tmpl.id}`}
                    className="block p-4 hover:bg-gray-50"
                  >
                    <p className="font-medium">{tmpl.name}</p>
                    <p className="text-sm text-gray-600">{tmpl.subject}</p>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No templates yet
                </div>
              )}
            </div>
          </div>

          {/* Scheduled */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Scheduled Messages
              </h2>
            </div>
            <div className="divide-y">
              {scheduled?.length ? (
                scheduled.slice(0, 5).map((msg: any) => (
                  <div key={msg.id} className="p-4">
                    <p className="font-medium">{msg.title}</p>
                    <p className="text-sm text-gray-600">
                      Scheduled: {new Date(msg.send_at).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No scheduled messages
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
