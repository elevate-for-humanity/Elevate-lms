import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { MessageSquare, Send, User, ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Instructor Messages | LMS',
  description: 'Message your instructors.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorMessagesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login?redirect=/lms/messages/instructor');

  // Fetch messages from database
  const { data: messages, error } = await db
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      is_read,
      sender_id,
      recipient_id,
      sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
      recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq('message_type', 'instructor')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching messages:', error.message);
  }

  const messageList = messages || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/lms/messages" className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Instructor Messages</h1>
              <p className="text-sm text-gray-500">Communicate with your instructors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {messageList.length > 0 ? (
          <div className="bg-white rounded-xl border divide-y">
            {messageList.map((msg: any) => {
              const isFromMe = msg.sender_id === user.id;
              const otherPerson = isFromMe ? msg.recipient : msg.sender;
              
              return (
                <div key={msg.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {isFromMe ? `To: ${otherPerson?.full_name || 'Instructor'}` : otherPerson?.full_name || 'Instructor'}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{msg.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
            <p className="text-gray-600 mb-6">Start a conversation with your instructor.</p>
            <Link 
              href="/lms/messages?type=instructor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              <Send className="w-4 h-4" />
              New Message
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
