
"use client";

import React from 'react';
// components/support/SupportTicketForm.tsx

import { useState } from 'react';

export function SupportTicketForm() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      if (!res.ok) throw new Error('Request failed');

      setStatus('success');
      setSubject('');
      setMessage('');
    } catch (error) {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-black">
          Subject
        </label>
        <input
          value={subject}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setSubject(e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-orange-500 focus:ring-2 focus:ring-brand-orange-100"
          placeholder="Describe the issue"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-black">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMessage(e.target.value)}
          className="mt-1 h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-orange-500 focus:ring-2 focus:ring-brand-orange-100"
          placeholder="Tell us what happened, steps to reproduce, and any error messages."
          required
        />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-2xl bg-brand-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-orange-600 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Submit Support Ticket'}
      </button>
      {status === 'success' && (
        <p className="text-xs text-brand-orange-600">
          Your ticket has been submitted. Our team will follow up by email.
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-brand-orange-600">
          Something went wrong. Please try again later.
        </p>
      )}
    </form>
  );
}
