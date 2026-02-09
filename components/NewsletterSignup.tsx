"use client";

import React from 'react';

import { useState } from 'react';
<<<<<<< HEAD
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
=======
import { Mail, Circle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
>>>>>>> d5f142eac (Add database integration to all components with createClient)

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const supabase = createClient();
      
      // Save to newsletter_subscribers table
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({
          email: email.toLowerCase().trim(),
          subscribed_at: new Date().toISOString(),
          status: 'pending_confirmation',
          source: 'website_signup',
        }, {
          onConflict: 'email',
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      setStatus('success');
      setMessage('Thanks for subscribing! Check your email to confirm.');
      setEmail('');

      // Reset after 5 seconds
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
    <div className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Mail className="w-8 h-8 text-white" />
            <h3 className="text-2xl md:text-3xl font-bold text-white">
              Stay Connected
            </h3>
          </div>
          <p className="text-lg text-blue-100 mb-6">
            Get updates on new programs, success stories, hiring events, and
            opportunities delivered to your inbox.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
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
              className="px-6 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === 'loading'
                ? 'Subscribing...'
                : status === 'success'
                  ? 'Subscribed!'
                  : 'Subscribe'}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 flex items-center justify-center gap-2 text-sm ${
                status === 'success' ? 'text-green-100' : 'text-red-100'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          )}

          <p className="text-xs text-blue-200 mt-4">
            We respect your privacy. Unsubscribe anytime. View our{' '}
            <a href="/privacy-policy" className="underline hover:text-white">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
