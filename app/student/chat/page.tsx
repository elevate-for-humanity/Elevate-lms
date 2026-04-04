'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  MessageCircle,
  Send,
  User,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createBrowserClient } from '@supabase/ssr';

interface Conversation {
  id: string;
  name: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  sender: 'me' | 'other';
  text: string;
  timestamp: string;
}

const getSupabase = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function StudentChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadConversations() {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get distinct conversation partners from messages table
      const { data: sent } = await supabase
        .from('messages')
        .select('recipient_id, body, created_at, read')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      const { data: received } = await supabase
        .from('messages')
        .select('sender_id, body, created_at, read')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      // Build conversation list from unique partners
      const partnerMap = new Map<string, { lastMessage: string; timestamp: string; unread: number }>();

      for (const m of (received || [])) {
        if (!partnerMap.has(m.sender_id)) {
          partnerMap.set(m.sender_id, {
            lastMessage: m.body || '',
            timestamp: m.created_at,
            unread: !m.read ? 1 : 0,
          });
        } else if (!m.read) {
          const existing = partnerMap.get(m.sender_id)!;
          existing.unread++;
        }
      }

      for (const m of (sent || [])) {
        if (!partnerMap.has(m.recipient_id)) {
          partnerMap.set(m.recipient_id, {
            lastMessage: m.body || '',
            timestamp: m.created_at,
            unread: 0,
          });
        }
      }

      // Fetch partner profiles
      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .in('id', partnerIds);

      const convos: Conversation[] = partnerIds.map(pid => {
        const profile = (profiles || []).find(p => p.id === pid);
        const info = partnerMap.get(pid)!;
        const ts = new Date(info.timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
        const timeStr = diffDays === 0
          ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : diffDays === 1 ? 'Yesterday'
          : ts.toLocaleDateString();

        return {
          id: pid,
          name: profile?.full_name || 'Unknown',
          role: profile?.role || 'user',
          lastMessage: info.lastMessage.substring(0, 60),
          timestamp: timeStr,
          unread: info.unread,
          online: false,
        };
      });

      setConversations(convos);
      if (convos.length > 0) setSelectedConversation(convos[0].id);
    }

    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConversation || !userId) return;

    async function loadMessages() {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('messages')
        .select('id, sender_id, body, created_at')
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: true })
        .limit(100);

      setMessages((data || []).map(m => ({
        id: m.id,
        sender: m.sender_id === userId ? 'me' : 'other',
        text: m.body || '',
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })));

      // Mark received messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', selectedConversation)
        .eq('recipient_id', userId)
        .eq('read', false);
    }

    loadMessages();
  }, [selectedConversation, userId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId) return;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        recipient_id: selectedConversation,
        body: newMessage.trim(),
      })
      .select('id, created_at')
      .single();

    if (!error && data) {
      setMessages(prev => [...prev, {
        id: data.id,
        sender: 'me',
        text: newMessage.trim(),
        timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }

    setNewMessage('');
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Student', href: '/student' }, { label: 'Chat' }]} />
        </div>
      </div>

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo.id)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-white text-left ${
                      selectedConversation === convo.id ? 'bg-brand-blue-50' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      {convo.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">{convo.name}</p>
                        <span className="text-xs text-gray-500">{convo.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-500">{convo.role}</p>
                      <p className="text-sm text-gray-600 truncate mt-1">{convo.lastMessage}</p>
                    </div>
                    {convo.unread > 0 && (
                      <span className="w-5 h-5 bg-brand-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                        {convo.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            {selectedConvo ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      {selectedConvo.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedConvo.name}</p>
                      <p className="text-xs text-gray-500">
                        {selectedConvo.online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2 rounded-2xl ${
                          message.sender === 'me'
                            ? 'bg-brand-blue-600 text-white'
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'me' ? 'text-white' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-brand-blue-500"
                    />
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSend}
                      className="p-2 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
