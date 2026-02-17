'use client';

import Link from 'next/link';
import { Archive, ArrowLeft, Mail, Trash2, RotateCcw } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function ArchivedMessagesPage() {
  const archivedMessages = [
    { id: '1', from: 'Career Services', subject: 'Your resume has been reviewed', date: 'Dec 15, 2025', preview: 'Thank you for submitting your resume...' },
    { id: '2', from: 'Admissions', subject: 'Welcome to Elevate!', date: 'Nov 20, 2025', preview: 'Congratulations on your enrollment...' },
    { id: '3', from: 'Financial Aid', subject: 'WIOA funding approved', date: 'Nov 15, 2025', preview: 'Your funding application has been...' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Messages', href: '/messages' }, { label: 'Archived' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/messages" className="inline-flex items-center text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Archive className="w-8 h-8 text-gray-400 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Archived Messages</h1>
          </div>
          <span className="text-gray-500">{archivedMessages.length} messages</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {archivedMessages.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {archivedMessages.map((message) => (
                <div key={message.id} className="p-4 hover:bg-gray-50 flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{message.from}</p>
                      <span className="text-sm text-gray-500">{message.date}</span>
                    </div>
                    <p className="text-gray-900 truncate">{message.subject}</p>
                    <p className="text-sm text-gray-500 truncate">{message.preview}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-brand-blue-600 transition" title="Restore">
                      <RotateCcw className="w-5 h-5" />
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
              <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No archived messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
