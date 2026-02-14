import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import { MessageSquare, Search, Star, Send, Paperclip, MoreVertical, Check, CheckCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Messages | Employer Portal',
  description: 'Communicate with candidates and the Elevate team.',
  robots: { index: false, follow: false },
};

const conversations = [
  {
    id: 1,
    name: 'Student',
    role: 'Barber Apprentice Candidate',
    avatar: '/images/employer/avatar-1.jpg',
    lastMessage: 'Thank you for the interview opportunity! I am very excited about the position.',
    time: '10:30 AM',
    unread: 2,
    starred: true,
    online: true,
  },
  {
    id: 2,
    name: 'Elevate Support',
    role: 'Support Team',
    avatar: '/images/community/community-hero.jpg',
    lastMessage: 'Your WOTC application has been approved. The tax credit will be applied to your account.',
    time: 'Yesterday',
    unread: 0,
    starred: false,
    online: true,
  },
  {
    id: 3,
    name: 'Sarah Williams',
    role: 'Medical Assistant Candidate',
    avatar: '/images/employer/avatar-2.jpg',
    lastMessage: 'I have completed all the required certifications. When can I start?',
    time: 'Yesterday',
    unread: 0,
    starred: true,
    online: false,
  },
];

const messages = [
  {
    id: 1,
    sender: 'Student',
    content: 'Hello! I saw the Barber Apprentice position and I am very interested.',
    time: '9:15 AM',
    isMe: false,
  },
  {
    id: 2,
    sender: 'You',
    content: 'Hi Marcus! Thanks for reaching out. We would love to schedule an interview. Are you available Thursday at 2 PM?',
    time: '9:45 AM',
    isMe: true,
  },
  {
    id: 3,
    sender: 'Student',
    content: 'Yes, Thursday at 2 PM works perfectly! Should I bring anything?',
    time: '10:00 AM',
    isMe: false,
  },
  {
    id: 4,
    sender: 'You',
    content: 'Please bring your portfolio and any certifications. We will discuss the apprenticeship program and WOTC benefits.',
    time: '10:15 AM',
    isMe: true,
  },
  {
    id: 5,
    sender: 'Student',
    content: 'Thank you for the interview opportunity! I am very excited about the position.',
    time: '10:30 AM',
    isMe: false,
  },
];

export default function EmployerMessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Messages" }]} />
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
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv, index) => (
                  <div
                    key={conv.id}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${index === 0 ? 'bg-brand-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Image
                          src={conv.avatar}
                          alt={conv.name}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{conv.name}</h3>
                          <span className="text-xs text-gray-500">{conv.time}</span>
                        </div>
                        <p className="text-xs text-gray-500">{conv.role}</p>
                        <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {conv.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {conv.unread > 0 && (
                          <span className="px-2 py-0.5 bg-brand-blue-600 text-white text-xs rounded-full">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src={conversations[0].avatar}
                      alt={conversations[0].name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{conversations[0].name}</h3>
                    <p className="text-sm text-green-600">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-md">
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.isMe
                            ? 'bg-brand-blue-600 text-white rounded-br-md'
                            : 'bg-gray-100 text-gray-900 rounded-bl-md'
                        }`}
                      >
                        <p>{msg.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${msg.isMe ? 'justify-end' : ''}`}>
                        <span className="text-xs text-gray-500">{msg.time}</span>
                        {msg.isMe && <CheckCheck className="w-4 h-4 text-brand-blue-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-full focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                  <button className="p-3 bg-brand-blue-600 text-white rounded-full hover:bg-brand-blue-700 transition">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
