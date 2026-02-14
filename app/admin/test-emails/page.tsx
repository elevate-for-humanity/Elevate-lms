'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestEmailsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const sendTestEmail = async (emailType: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_type: emailType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setResult({
        success: true,
        message: data.message,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message:
          (err instanceof Error ? err.message : String(err)) ||
          'Failed to send test email',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Test Emails" }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="text-brand-blue-600 hover:text-brand-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Mail className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-3xl font-bold text-black">
              Test Email System
            </h1>
          </div>
          <p className="text-black">
            Verify that automated emails are working correctly
          </p>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              result.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{result.message}</span>
            </div>
          </div>
        )}

        {/* Email System Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Email System Status
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-black">
                Email Provider
              </span>
              <span className="text-sm text-black">Resend</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-black">
                Configuration
              </span>
              <span className="text-sm text-brand-green-600 font-medium">
                • Configured
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-black">API Key</span>
              <span className="text-sm text-brand-green-600 font-medium">
                • Set
              </span>
            </div>
          </div>
        </div>

        {/* Test Email Types */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Send Test Emails
          </h2>
          <p className="text-sm text-black mb-6">
            Click a button below to send a test email to your admin account.
            Check your inbox to verify delivery.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => sendTestEmail('welcome')}
              disabled={loading}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-brand-blue-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-8 h-8 text-brand-blue-600" />
              <div className="text-center">
                <div className="font-semibold text-black">Welcome Email</div>
                <div className="text-xs text-black mt-1">
                  New user onboarding
                </div>
              </div>
            </button>

            <button
              onClick={() => sendTestEmail('reminder')}
              disabled={loading}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-8 h-8 text-brand-orange-600" />
              <div className="text-center">
                <div className="font-semibold text-black">
                  Reminder Email
                </div>
                <div className="text-xs text-black mt-1">
                  Action required alerts
                </div>
              </div>
            </button>

            <button
              onClick={() => sendTestEmail('notification')}
              disabled={loading}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-8 h-8 text-brand-green-600" />
              <div className="text-center">
                <div className="font-semibold text-black">
                  Notification Email
                </div>
                <div className="text-xs text-black mt-1">
                  Activity updates
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Email Triggers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-black mb-4">
            Automated Email Triggers
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-black">
                  Student Application
                </div>
                <div className="text-black">
                  Welcome email sent on successful enrollment
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-black">
                  Shop Partner Application
                </div>
                <div className="text-black">
                  Confirmation email sent to new shop partners
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-black">Contact Form</div>
                <div className="text-black">
                  Notification sent to admin on new inquiries
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-black">License Request</div>
                <div className="text-black">
                  Confirmation and admin notification emails
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <CheckCircle className="w-5 h-5 text-brand-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-black">Partner Inquiry</div>
                <div className="text-black">
                  Confirmation and admin notification emails
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
