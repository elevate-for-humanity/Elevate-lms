import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Search, 
  Plus, 
  User,
  Clock,
  CheckCheck,
  Star,
  Archive,
  Trash2
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Messages | Student Portal',
  description: 'View and send messages to instructors, classmates, and support staff.',
};

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let conversations: any[] = [];
  let unreadCount = 0;

  try {
    const { data: messageData } = await db
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (messageData) {
      // Group messages into conversations
      const convMap = new Map();
      messageData.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const other = msg.sender_id === user.id ? msg.recipient : msg.sender;
        
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            id: otherId,
            participant: other,
            lastMessage: msg,
            unread: msg.recipient_id === user.id && !msg.read_at ? 1 : 0
          });
        } else if (msg.recipient_id === user.id && !msg.read_at) {
          convMap.get(otherId).unread++;
        }
      });
      
      conversations = Array.from(convMap.values());
      unreadCount = conversations.reduce((sum, c) => sum + c.unread, 0);
    }
  } catch (error) {
    // Tables may not exist
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Messages" }]} />
      </div>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
            <p className="text-slate-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
              <Plus className="w-4 h-4" />
              New Message
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-600 hover:bg-white rounded-lg" title="Starred">
                  <Star className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-600 hover:bg-white rounded-lg" title="Archive">
                  <Archive className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Conversations List */}
          {conversations.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/lms/messages/${conv.id}`}
                  className={`block p-4 hover:bg-white transition ${conv.unread > 0 ? 'bg-brand-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {conv.participant?.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${conv.unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                          {conv.participant?.full_name || 'Unknown User'}
                        </h3>
                        <span className="text-sm text-slate-500 flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessage.created_at)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conv.unread > 0 ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {conv.lastMessage.sender_id === user.id && (
                          <span className="text-slate-400 mr-1">You:</span>
                        )}
                        {conv.lastMessage.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.lastMessage.sender_id === user.id && conv.lastMessage.read_at && (
                          <CheckCheck className="w-4 h-4 text-brand-blue-500" />
                        )}
                        {conv.unread > 0 && (
                          <span className="px-2 py-0.5 bg-brand-blue-600 text-white text-xs font-bold rounded-full">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Messages Yet</h3>
              <p className="text-slate-600 mb-6">
                Start a conversation with your instructors or classmates.
              </p>
              <button className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition">
                <Plus className="w-5 h-5" />
                Start a Conversation
              </button>
            </div>
          )}
        </div>

        {/* Quick Contacts */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Contacts</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/learner/messages" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue-300 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Student Support</h3>
                  <p className="text-sm text-slate-600">Get help with your account</p>
                </div>
              </div>
            </Link>
            <Link href="/lms/messages/instructor" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue-300 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">My Instructor</h3>
                  <p className="text-sm text-slate-600">Ask course questions</p>
                </div>
              </div>
            </Link>
            <Link href="/lms/messages/career" className="bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue-300 hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Career Services</h3>
                  <p className="text-sm text-slate-600">Job placement help</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
