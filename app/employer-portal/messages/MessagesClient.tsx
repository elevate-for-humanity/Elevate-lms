'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Search, Star, Send, Paperclip, MoreVertical, CheckCheck, Loader2 } from 'lucide-react';

interface Conversation {
  id: string;
  participant_ids: string[];
  subject: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  other_name: string;
  other_avatar: string | null;
  other_role: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Props {
  conversations: Conversation[];
  currentUserId: string;
}

export default function MessagesClient({ conversations: initialConversations, currentUserId }: Props) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversations[0]?.id || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) return;
    setLoading(true);

    supabase
      .from('portal_messages')
      .select('*')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages(data || []);
        setLoading(false);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

    // Mark messages as read
    supabase
      .from('portal_messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', activeConvId)
      .neq('sender_id', currentUserId)
      .eq('read', false)
      .then(() => {});
  }, [activeConvId]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!activeConvId) return;

    const channel = supabase
      .channel(`messages:${activeConvId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'portal_messages',
        filter: `conversation_id=eq.${activeConvId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConvId || sending) return;
    setSending(true);

    const { error } = await supabase.from('portal_messages').insert({
      conversation_id: activeConvId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });

    if (!error) {
      // Update conversation preview
      await supabase.from('conversations').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: newMessage.trim().slice(0, 100),
      }).eq('id', activeConvId);

      setNewMessage('');
    }
    setSending(false);
  };

  const filteredConversations = searchQuery
    ? conversations.filter(c =>
        c.other_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message_preview?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600">Communicate with candidates and support</p>
            </div>
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              New Message
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-4 border-b hover:bg-white transition ${
                        conv.id === activeConvId ? 'bg-brand-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-blue-600 font-bold text-sm">
                            {conv.other_name[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">{conv.other_name}</h3>
                            <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(conv.last_message_at)}</span>
                          </div>
                          <p className="text-xs text-gray-500">{conv.other_role}</p>
                          <p className="text-sm text-gray-600 truncate mt-1">{conv.last_message_preview || 'No messages yet'}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message thread */}
            <div className="flex-1 flex flex-col">
              {activeConv ? (
                <>
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-brand-blue-600 font-bold">
                          {activeConv.other_name[0]?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{activeConv.other_name}</h3>
                        <p className="text-sm text-gray-500">{activeConv.other_role}</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg">
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map(msg => {
                        const isMe = msg.sender_id === currentUserId;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-md">
                              <div className={`px-4 py-3 rounded-2xl ${
                                isMe
                                  ? 'bg-brand-blue-600 text-white rounded-br-md'
                                  : 'bg-white text-gray-900 rounded-bl-md'
                              }`}>
                                <p>{msg.content}</p>
                              </div>
                              <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                                {isMe && msg.read && <CheckCheck className="w-4 h-4 text-brand-blue-500" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t">
                    <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-3">
                      <button type="button" className="p-2 hover:bg-white rounded-lg">
                        <Paperclip className="w-5 h-5 text-gray-500" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 transition disabled:opacity-50"
                      >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
