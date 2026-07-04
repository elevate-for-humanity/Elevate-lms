'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Search, User, ArrowLeft, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message_preview: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface MessagesClientProps {
  userId: string;
  initialConversations: Conversation[];
  participants: Record<string, any>;
}

export default function MessagesClient({
  userId,
  initialConversations,
  participants,
}: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getOtherParticipant = (conv: Conversation) => {
    const otherId =
      conv.participant_1_id === userId ? conv.participant_2_id : conv.participant_1_id;
    return participants[otherId] || { full_name: 'Unknown User' };
  };

  const fetchMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages?conversation_id=${conversationId}`);
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages ?? []);
      }
    } catch {
      // silently fail — messages will be empty
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: selectedConversation,
        content: newMessage.trim(),
      }),
    });
    if (res.ok) {
      const d = await res.json();
      if (d.message) setMessages((prev) => [...prev, d.message]);
      setNewMessage('');
    }
    setSending(false);
  };

  const deleteMessage = async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          </div>
        </div>

        <div className="flex h-[calc(100vh-120px)]">
          {/* Conversations List */}
          <div
            className={`w-full md:w-80 border-r bg-white ${selectedConversation ? 'hidden md:block' : ''}`}
          >
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="font-medium text-slate-900 mb-1">No conversations yet</p>
                  <p className="text-sm text-slate-700 mb-4">
                    Threads are opened by staff when needed.
                  </p>
                  <a
                    href="/contact?subject=support"
                    className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Contact Support
                  </a>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-white border-b transition ${
                        selectedConversation === conv.id ? 'bg-brand-blue-50' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        {other.avatar_url ? (
                          <Image sizes="100vw"
                            src={other.avatar_url}
                            alt={other.full_name || 'Contact'}
                            width={48}
                            height={48}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-slate-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium text-slate-900 truncate">{other.full_name}</p>
                        <p className="text-sm text-slate-700 truncate">
                          {conv.last_message_preview || 'No messages'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {conv.last_message_at ? formatTime(conv.last_message_at) : ''}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div
            className={`flex-1 flex flex-col bg-white ${!selectedConversation ? 'hidden md:flex' : ''}`}
          >
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 -ml-2 text-slate-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {(() => {
                    const conv = conversations.find((c) => c.id === selectedConversation);
                    const other = conv ? getOtherParticipant(conv) : { full_name: 'Unknown' };
                    return (
                      <>
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                          {other.avatar_url ? (
                            <Image sizes="100vw"
                              src={other.avatar_url}
                              alt={other.full_name || 'Contact'}
                              width={48}
                              height={48}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-slate-700" />
                          )}
                        </div>
                        <span className="font-medium text-slate-900">{other.full_name}</span>
                      </>
                    );
                  })()}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-slate-700 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-700">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="group relative">
                          <div
                            className={`max-w-2/3 px-4 py-2 rounded-2xl ${
                              msg.sender_id === userId
                                ? 'bg-brand-blue-600 text-white'
                                : 'bg-white border text-slate-900'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender_id === userId ? 'text-white' : 'text-slate-700'
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                          {msg.sender_id === userId && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="absolute -top-2 -right-2 hidden group-hover:flex w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full items-center justify-center text-xs leading-none"
                              title="Delete message"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMessage} className="bg-white border-t p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="p-3 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <User className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                  <p className="font-medium text-slate-900 mb-1">Select a conversation</p>
                  <p className="text-sm text-slate-700">
                    Choose a thread from the list to read and reply.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
