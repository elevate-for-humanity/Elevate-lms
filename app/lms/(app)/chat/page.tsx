import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/chat' },
  title: 'Chat | Elevate For Humanity',
  description: 'Connect with instructors and peers.',
};

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch user's conversations from messages table
  const { data: conversations } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      created_at,
      sender_id,
      recipient_id
    `)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50);

  const messages = conversations || [];

  // Get unique conversation partners
  const partnerIds = new Set<string>();
  messages.forEach((msg: any) => {
    const partnerId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
    if (partnerId) partnerIds.add(partnerId);
  });

  // Fetch partner profiles
  const { data: partners } = partnerIds.size > 0 ? await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', Array.from(partnerIds)) : { data: [] };

  const partnerMap = new Map((partners || []).map((p: any) => [p.id, p]));

  // Build conversation list
  const conversationList = Array.from(partnerIds).map(partnerId => {
    const partner = partnerMap.get(partnerId);
    const lastMsg = messages.find((m: any) => 
      m.sender_id === partnerId || m.recipient_id === partnerId
    );
    return {
      partnerId,
      name: partner?.full_name || 'Unknown User',
      initials: (partner?.full_name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
      lastMessage: lastMsg?.content || '',
      lastMessageTime: lastMsg?.created_at,
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms/dashboard" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Chat</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">Connect with instructors and classmates</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b"><input type="text" placeholder="Search conversations..." className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="divide-y">
              {conversationList.length > 0 ? (
                conversationList.map((conv, idx) => (
                  <div key={conv.partnerId} className={`p-4 hover:bg-white cursor-pointer ${idx === 0 ? 'bg-brand-blue-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-brand-blue-600 font-medium">{conv.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{conv.name}</p>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>No conversations yet</p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border flex flex-col h-[600px]">
            {conversationList.length > 0 ? (
              <>
                <div className="p-4 border-b">
                  <p className="font-semibold">{conversationList[0]?.name || 'Select a conversation'}</p>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {messages.filter((m: any) => 
                      m.sender_id === conversationList[0]?.partnerId || 
                      m.recipient_id === conversationList[0]?.partnerId
                    ).slice(0, 20).reverse().map((msg: any) => (
                      <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg p-3 max-w-xs ${msg.sender_id === user.id ? 'bg-brand-blue-600 text-white' : 'bg-white'}`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Type a message..." className="flex-1 border rounded-lg px-3 py-2" />
                    <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Send</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a conversation or start a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
