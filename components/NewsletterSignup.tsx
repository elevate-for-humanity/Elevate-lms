"use client";

import React from 'react';

import { useState } from 'react';
import { Mail, AlertCircle } from 'lucide-react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot: if filled, silently fake success
    if (website) {
      setStatus('success');
      setMessage('Thanks for subscribing! Check your email to confirm.');
      setEmail('');
      setTimeout(() => { setStatus('idle'); setMessage(''); }, 5000);
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'homepage' }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setStatus('success');
      setMessage(
        data.duplicate
          ? "You're already subscribed!"
          : 'Thanks for subscribing! Check your email to confirm.'
      );
      setEmail('');

      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');

      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  return (
    <div className="bg-slate-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-8 h-8 text-white" />
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Stay Connected
            </h3>
          </div>
          <p className="text-lg text-white mb-6">
            Get updates on new programs, success stories, hiring events, and
            opportunities delivered to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            {/* Honeypot — hidden from humans, bots fill it */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={status === 'loading' || status === 'success'}
              className="flex-1 px-4 py-3 rounded-lg text-black Content:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="px-6 py-3 bg-white text-brand-blue-600 font-bold rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === 'loading'
                ? 'Subscribing...'
                : status === 'success'
                  ? 'Subscribed!'
                  : 'Subscribe'}
            </button>
          </form>

          {message && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white">
              {status !== 'success' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <p className="text-xs text-white mt-4">
            We respect your privacy. Unsubscribe anytime. View our{' '}
            <a href="/privacy-policy" className="underline hover:text-brand-red-300">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
