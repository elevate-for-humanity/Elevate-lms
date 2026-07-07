'use client';

import { useState } from 'react';
import { Users, RefreshCw, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string;
  account: string;
  phone: string;
  lastSynced?: string;
}

export default function SalesforceClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const connectSalesforce = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/salesforce/connect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          setConnected(true);
          fetchContacts();
        }
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
    setLoading(false);
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/salesforce/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setConnected(true);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
    setLoading(false);
  };

  const syncContacts = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/admin/integrations/salesforce/sync', { method: 'POST' });
      if (res.ok) {
        setSyncStatus('success');
        fetchContacts();
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Salesforce Integration</h1>
        <div className="flex gap-2">
          {connected && (
            <>
              <button
                onClick={fetchContacts}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={syncContacts}
                disabled={syncStatus === 'syncing'}
                className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
              >
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${connected ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Users className={`w-8 h-8 ${connected ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="font-medium text-slate-900">Salesforce Connection</h2>
            <p className="text-sm text-slate-500">
              {connected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                'Connect your Salesforce account'
              )}
            </p>
          </div>
        </div>

        {syncStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            Sync completed successfully
          </div>
        )}

        {syncStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            Sync failed. Please try again.
          </div>
        )}

        {!connected ? (
          <button
            onClick={connectSalesforce}
            disabled={loading}
            className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            <LinkIcon className="w-5 h-5 inline mr-2" />
            {loading ? 'Connecting...' : 'Connect Salesforce'}
          </button>
        ) : (
          <div className="mt-4">
            <h3 className="font-medium text-slate-900 mb-3">Contacts ({contacts.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Account</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Last Synced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No contacts found</td>
                    </tr>
                  ) : (
                    contacts.map((contact) => (
                      <tr key={contact.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900">{contact.name}</td>
                        <td className="px-4 py-2 text-slate-600">{contact.email}</td>
                        <td className="px-4 py-2 text-slate-600">{contact.account}</td>
                        <td className="px-4 py-2 text-slate-600">{contact.phone}</td>
                        <td className="px-4 py-2 text-slate-500 text-sm">{contact.lastSynced || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
