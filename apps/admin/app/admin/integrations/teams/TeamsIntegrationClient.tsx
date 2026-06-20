'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Send, AlertCircle } from 'lucide-react';

interface Props {
  isConfigured: boolean;
  webhookConfigured: boolean;
}

const EVENTS = [
  {
    key: 'new_application',
    label: 'New application submitted',
    description: 'Fires when a learner submits an application via /apply',
  },
  {
    key: 'application_approved',
    label: 'Application approved',
    description: 'Fires after the full approval pipeline completes',
  },
  {
    key: 'checkpoint_failed',
    label: 'Checkpoint failed',
    description: 'Fires when a learner fails a checkpoint — at-risk signal',
  },
];

export default function TeamsIntegrationClient({ isConfigured, webhookConfigured }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');

  async function sendTest() {
    setTesting(true);
    setTestResult(null);
    setTestError('');
    try {
      const res = await fetch('/api/admin/integrations/teams/test', { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Test failed');
      }
      setTestResult('success');
    } catch (err: any) {
      setTestResult('error');
      setTestError(err.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-amber-500'}`}
                />
                {isConfigured ? 'Webhook configured' : 'Not configured'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isConfigured
                ? 'TEAMS_WEBHOOK_URL is set. Notifications are active.'
                : 'Set TEAMS_WEBHOOK_URL in your environment to enable notifications.'}
            </p>
          </div>
          {isConfigured && (
            <button
              onClick={sendTest}
              disabled={testing}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue-700 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-800 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              {testing ? 'Sending…' : 'Send test'}
            </button>
          )}
        </div>

        {testResult === 'success' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Test message sent successfully.
          </div>
        )}
        {testResult === 'error' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {testError || 'Test failed. Check TEAMS_WEBHOOK_URL.'}
          </div>
        )}

        {!isConfigured && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700 mb-2">Setup instructions</p>
            <ol className="space-y-1.5 text-sm text-slate-600 list-decimal list-inside">
              <li>In Microsoft Teams, open the channel you want notifications in</li>
              <li>
                Click <strong>···</strong> → <strong>Connectors</strong> →{' '}
                <strong>Incoming Webhook</strong>
              </li>
              <li>Create the webhook and copy the URL</li>
              <li>
                Set <code className="bg-slate-100 px-1 rounded text-xs">TEAMS_WEBHOOK_URL</code> in
                Northflank runtime environment
              </li>
              <li>Redeploy — notifications will be active immediately</li>
            </ol>
          </div>
        )}
      </div>

      {/* Active events */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Active Notification Events</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            These events send a Teams message when they fire
          </p>
        </div>
        <ul className="divide-y divide-slate-50">
          {EVENTS.map((ev) => (
            <li key={ev.key} className="px-6 py-4 flex items-start gap-3">
              {isConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-900">{ev.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{ev.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
