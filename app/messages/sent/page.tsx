'use client';

import Link from 'next/link';
import { Send, ArrowLeft, Mail, Trash2, Eye } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function SentMessagesPage() {
  const sentMessages = [
    { id: '1', to: 'Career Services', subject: 'Question about job placement', date: 'Jan 15, 2026', preview: 'I wanted to ask about the job placement...' },
    { id: '2', to: 'Financial Aid', subject: 'Funding status inquiry', date: 'Jan 10, 2026', preview: 'Could you please provide an update on...' },
    { id: '3', to: 'My Instructor', subject: 'Assignment clarification', date: 'Jan 5, 2026', preview: 'I have a question about the assignment...' },
  ];

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Messages', href: '/messages' }, { label: 'Sent' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/messages" className="inline-flex items-center text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Send className="w-8 h-8 text-brand-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Sent Messages</h1>
          </div>
          <span className="text-gray-500">{sentMessages.length} messages</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {sentMessages.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {sentMessages.map((message) => (
                <div key={message.id} className="p-4 hover:bg-white flex items-center">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Mail className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">To: {message.to}</p>
                      <span className="text-sm text-gray-500">{message.date}</span>
                    </div>
                    <p className="text-gray-900 truncate">{message.subject}</p>
                    <p className="text-sm text-gray-500 truncate">{message.preview}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-brand-blue-600 transition" title="View">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-brand-red-600 transition" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Send className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No sent messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
