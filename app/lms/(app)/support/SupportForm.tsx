'use client';

import { useState } from 'react';
import { submitSupportRequest } from './actions';
import { Send, Loader2 } from 'lucide-react';

export function SupportForm() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setMessage(null);

    const result = await submitSupportRequest(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: result.message || 'Request submitted!' });
      // Reset form
      const form = document.getElementById('support-form') as HTMLFormElement;
      form?.reset();
    }

    setSubmitting(false);
  }

  return (
    <form id="support-form" action={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="category"
          name="category"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
        >
          <option value="general">General Question</option>
          <option value="technical">Technical Issue</option>
          <option value="course">Course Content</option>
          <option value="billing">Billing & Payments</option>
          <option value="certificate">Certificates</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Subject *
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder="Brief description of your issue"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder="Please describe your issue in detail..."
        />
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
        >
          <option value="low">Low - General question</option>
          <option value="normal" selected>Normal - Need help soon</option>
          <option value="high">High - Blocking my progress</option>
          <option value="urgent">Urgent - Cannot access my account</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Request
          </>
        )}
      </button>
    </form>
  );
}
