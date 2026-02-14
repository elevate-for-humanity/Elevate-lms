
'use client';

import React from 'react';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviterName?: string;
}

export default function OrgInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    try {
      const supabase = createClient();

      // Get current user's organization
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) return;

      // Get invites for this organization
      const { data, error }: any = await supabase
        .from('org_invites')
        .select(
          `
          id,
          email,
          role,
          created_at,
          expires_at,
          accepted_at,
          inviter:profiles!org_invites_invited_by_fkey(full_name)
        `
        )
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvites = data.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role || 'member',
        status: invite.accepted_at
          ? 'accepted'
          : new Date(invite.expires_at) < new Date()
            ? 'expired'
            : 'pending',
        createdAt: invite.created_at,
        expiresAt: invite.expires_at,
        acceptedAt: invite.accepted_at,
        inviterName: invite.inviter?.full_name,
      }));

      setInvites(formattedInvites);
      setLoading(false);
    } catch (err) {
      setError('Failed to load invitations');
      setLoading(false);
    }
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      const response = await fetch('/api/org/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to send invitation');
      }

      // Reset form and reload invites
      setInviteEmail('');
      setInviteRole('member');
      setShowInviteForm(false);
      await loadInvites();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation'
      );
    } finally {
      setSending(false);
    }
  }

  async function resendInvite(inviteId: string) {
    try {
      const response = await fetch(`/api/org/invite/${inviteId}/resend`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resend invitation');
      }

      alert('Invitation resent successfully');
    } catch (err) {
      alert('Failed to resend invitation');
    }
  }

  async function revokeInvite(inviteId: string) {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/org/invite/${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invitation');
      }

      await loadInvites();
    } catch (err) {
      alert('Failed to revoke invitation');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-black">
            Organization Invitations
          </h1>
          <p className="mt-2 text-sm text-black">
            Manage pending and accepted invitations to your organization
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowInviteForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Invitation
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showInviteForm && (
        <div className="mt-6 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-black">
              Send New Invitation
            </h3>
            <form onSubmit={sendInvite} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-black"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="your.email@gmail.com"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-black"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteEmail('');
                    setInviteRole('member');
                    setError(null);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex justify-center rounded-md border border-transparent bg-brand-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                      Email
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                      Role
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                      Invited By
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-black">
                      Expires
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {invites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-sm text-black"
                      >
                        No invitations found
                      </td>
                    </tr>
                  ) : (
                    invites.map((invite) => (
                      <tr key={invite.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                          {invite.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                          {invite.role}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              invite.status === 'accepted'
                                ? 'bg-brand-green-100 text-green-800'
                                : invite.status === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {invite.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                          {invite.inviterName || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-black">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {invite.status === 'pending' && (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => resendInvite(invite.id)}
                                className="text-brand-blue-600 hover:text-blue-900"
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => revokeInvite(invite.id)}
                                className="text-brand-orange-600 hover:text-red-900"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
