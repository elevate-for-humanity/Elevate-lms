'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Paperclip, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/client';

export default function NewMessagePage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login?redirect=/messages/new');
      else setUserId(user.id);
    });
  }, []);

  const recipients = [
    { id: 'career-services', name: 'Career Services' },
    { id: 'financial-aid', name: 'Financial Aid' },
    { id: 'admissions', name: 'Admissions' },
    { id: 'student-support', name: 'Student Support' },
    { id: 'instructor', name: 'My Instructor' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.to || !formData.subject || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    if (!userId) {
      setError('You must be logged in to send messages.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertErr } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          subject: formData.subject,
          body: `[To: ${formData.to}]\n\n${formData.message}`,
          read: false,
        });

      if (insertErr) throw new Error(insertErr.message);
      router.push('/messages?sent=true');
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Messages', href: '/messages' }, { label: 'New Message' }]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/messages" className="inline-flex items-center text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Message</h1>

          {error && (
            <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-brand-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-brand-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To *</label>
              <select
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              >
                <option value="">Select recipient</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={8}
                placeholder="Type your message..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button type="button" className="flex items-center text-gray-600 hover:text-brand-blue-600">
                <Paperclip className="w-5 h-5 mr-2" />
                Attach File
              </button>
              <div className="flex items-center gap-4">
                <Link href="/messages" className="px-6 py-3 text-gray-700 hover:text-gray-900">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-8 py-3 rounded-lg font-bold transition inline-flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
