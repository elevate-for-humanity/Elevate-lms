'use client';

import { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function SupportForm() {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, category, message }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit ticket');
      }

      setStatus('success');
      setSubject('');
      setCategory('general');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <span className="text-slate-400 flex-shrink-0">•</span>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted</h3>
        <p className="text-gray-600 mb-6">
          We've received your support request and will respond within 24 hours.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-brand-blue-600 font-medium hover:underline"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8">
      <h2 className="text-xl font-bold mb-6">Submit a Support Request</h2>
      
      {status === 'error' && (
        <div className="mb-4 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-brand-red-800 font-medium">Error</p>
            <p className="text-brand-red-600 text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Brief description of your issue"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          >
            <option value="account">Account Issues</option>
            <option value="program">Program Questions</option>
            <option value="technical">Technical Support</option>
            <option value="billing">Billing</option>
            <option value="general">General</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            required
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Please describe your issue in detail..."
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-brand-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Request'
          )}
        </button>
      </form>
    </div>
  );
}
