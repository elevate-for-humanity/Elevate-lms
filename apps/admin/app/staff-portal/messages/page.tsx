'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  Send,
  Paperclip,
  Image,
  MoreVertical,
  Clock,
  Check,
  CheckCheck,
} from 'lucide-react';

const messages = [
  {
    id: 1,
    name: 'Marcus Johnson',
    avatar: null,
    lastMessage: 'Thank you for approving my hours!',
    time: '2h ago',
    unread: true,
    messages: [
      { from: 'them', text: 'Hi, I wanted to ask about the evaluation scheduled for next week.', time: '10:30 AM' },
      { from: 'me', text: 'Sure, let me check the schedule and get back to you.', time: '10:35 AM' },
      { from: 'them', text: 'Thank you for approving my hours!', time: '2h ago' },
    ],
  },
  {
    id: 2,
    name: 'DeShawn Williams',
    avatar: null,
    lastMessage: 'When is my next competency review?',
    time: '1d ago',
    unread: false,
    messages: [],
  },
  {
    id: 3,
    name: 'Elevate Admin',
    avatar: null,
    lastMessage: 'Monthly report is ready',
    time: '2d ago',
    unread: false,
    messages: [],
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentConversation = messages.find(m => m.id === selectedConversation);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Messages</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Conversations List */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedConversation(msg.id)}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition border-b border-slate-100 ${
                    selectedConversation === msg.id ? 'bg-brand-blue-50' : ''
                  }`}
                >
                  <div className="w-12 h-12 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-blue-600 font-semibold">{msg.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-semibold ${msg.unread ? 'text-slate-900' : 'text-slate-700'}`}>{msg.name}</span>
                      <span className="text-xs text-slate-400">{msg.time}</span>
                    </div>
                    <p className={`text-sm truncate ${msg.unread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {msg.lastMessage}
                    </p>
                  </div>
                  {msg.unread && <div className="w-2 h-2 bg-brand-blue-600 rounded-full flex-shrink-0 mt-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-brand-blue-600 font-semibold">{currentConversation.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{currentConversation.name}</p>
                      <p className="text-xs text-slate-500">Active now</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentConversation.messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.from === 'me' 
                          ? 'bg-brand-blue-600 text-white rounded-br-md' 
                          : 'bg-slate-100 text-slate-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.from === 'me' ? 'text-white/70 justify-end' : 'text-slate-400'
                        }`}>
                          {msg.time}
                          {msg.from === 'me' && <CheckCheck className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-slate-100 rounded-lg">
                      <Paperclip className="w-5 h-5 text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg">
                      <Image className="w-5 h-5 text-slate-400" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2 bg-slate-100 rounded-xl text-sm"
                    />
                    <button className="p-2 bg-brand-blue-600 text-white rounded-xl hover:bg-brand-blue-700">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10" />
                  </div>
                  <p className="font-semibold">Select a conversation</p>
                  <p className="text-sm">Choose a message thread to view</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
