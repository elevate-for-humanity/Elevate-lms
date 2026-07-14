'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewCampaignPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_name: 'Elevate for Humanity',
    from_email: 'info@elevateforhumanity.org',
    html_content: '',
    target_audience: 'all_students',
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      const res = await fetch('/api/crm/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Campaign sent to ${data.sent_count} recipients!` });
        setTimeout(() => router.push('/admin/crm/campaigns'), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send campaign' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send campaign' });
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 mb-4">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Create Email Campaign</h1>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Campaign Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="CDL August Cohort"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
              <select
                name="target_audience"
                value={formData.target_audience}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all_students">All Students</option>
                <option value="active_students">Active Students (Last 7 Days)</option>
                <option value="inactive_students">Inactive Students</option>
                <option value="program_holders">Program Holders</option>
                <option value="instructors">Instructors</option>
                <option value="employers">Employers</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="🚨 CDL CLASS STARTS AUGUST 3RD"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Name</label>
              <input
                type="text"
                name="from_name"
                value={formData.from_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Email</label>
              <input
                type="email"
                name="from_email"
                value={formData.from_email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Content (HTML)</label>
            <textarea
              name="html_content"
              value={formData.html_content}
              onChange={handleChange}
              required
              rows={15}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="<p>Dear {{student_name}},</p>&#10;&#10;<p>Your email content here...</p>"
            />
            <p className="mt-2 text-sm text-slate-500">
              Available variables: {'{{student_name}}'}, {'{{user_name}}'}, {'{{organization_name}}'}, {'{{dashboard_link}}'}, {'{{support_email}}'}, {'{{support_phone}}'}
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
