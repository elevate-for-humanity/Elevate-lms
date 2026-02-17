'use client';

import { useState } from 'react';
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

export default function StudentChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');

  const conversations: Conversation[] = [
    {
      id: '1',
      name: 'David T.',
      role: 'Instructor',
      lastMessage: 'Great work on your practical assignment!',
      timestamp: '10:30 AM',
      unread: 2,
      online: true,
    },
    {
      id: '2',
      name: 'Career Services',
      role: 'Support',
      lastMessage: 'Your resume has been reviewed.',
      timestamp: 'Yesterday',
      unread: 0,
      online: true,
    },
    {
      id: '3',
      name: 'Student Support',
      role: 'Support',
      lastMessage: 'How can we help you today?',
      timestamp: 'Jan 15',
      unread: 0,
      online: false,
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      sender: 'other',
      text: 'Hi! I reviewed your Week 3 practical assignment.',
      timestamp: '10:15 AM',
    },
    {
      id: '2',
      sender: 'other',
      text: 'Great work on your practical assignment! Your technique has improved significantly.',
      timestamp: '10:30 AM',
    },
    {
      id: '3',
      sender: 'me',
      text: 'Thank you! I practiced a lot this week.',
      timestamp: '10:32 AM',
    },
    {
      id: '4',
      sender: 'other',
      text: 'It shows! Keep up the good work. Let me know if you have any questions about the next module.',
      timestamp: '10:35 AM',
    },
  ];

  const handleSend = () => {
    if (!newMessage.trim()) return;
    // In production, this would send the message via API
    setNewMessage('');
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
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
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo.id)}
                    className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left ${
                      selectedConversation === convo.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500" />
                      </div>
                      {convo.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
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
                      <span className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
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
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
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
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
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
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'me' ? 'text-blue-200' : 'text-gray-500'
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500"
                    />
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Smile className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSend}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
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
