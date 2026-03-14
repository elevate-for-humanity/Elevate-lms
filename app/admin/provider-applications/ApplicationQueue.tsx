'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Building2, Mail, Phone, MapPin, Globe, Loader2,
} from 'lucide-react';

type Application = {
  id: string;
  org_name: string;
  org_type: string;
  ein: string | null;
  website: string | null;
  contact_name: string;
  contact_title: string | null;
  contact_email: string;
  contact_phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  program_types: string[];
  service_area: string | null;
  annual_enrollment: number | null;
  credential_authorities: string[];
  wioa_eligible: boolean;
  etpl_listed: boolean;
  etpl_state: string | null;
  accreditation: string | null;
  mission_statement: string | null;
  outcomes_description: string | null;
  partnership_goals: string | null;
  status: string;
  status_reason: string | null;
  review_notes: string | null;
  tenant_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
  { key: 'all', label: 'All' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-brand-blue-100 text-brand-blue-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
  withdrawn: 'bg-slate-100 text-slate-600',
};

const ORG_TYPE_LABELS: Record<string, string> = {
  training_provider: 'Training Provider',
  workforce_agency: 'Workforce Agency',
  employer: 'Employer',
  community_org: 'Community Organization',
};

export default function ApplicationQueue({
  applications,
  statusCounts,
  activeFilter,
}: {
  applications: Application[];
  statusCounts: Record<string, number>;
  activeFilter: string;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [actionState, setActionState] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function setFilter(status: string) {
    const url = status === 'all'
      ? '/admin/provider-applications'
      : `/admin/provider-applications?status=${status}`;
    startTransition(() => router.push(url));
  }

  async function submitAction(appId: string, action: 'approve' | 'deny' | 'under_review') {
    setActionState(s => ({ ...s, [appId]: 'loading' }));
    setActionMessages(m => ({ ...m, [appId]: '' }));

    try {
      const res = await fetch(`/api/provider/applications/${appId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNotes: reviewNotes[appId] ?? '' }),
      });
      const data = await res.json();

      if (!res.ok && res.status !== 207) {
        setActionState(s => ({ ...s, [appId]: 'error' }));
        setActionMessages(m => ({ ...m, [appId]: data.error ?? 'Action failed' }));
        return;
      }

      if (res.status === 207) {
        // Partial success: tenant provisioned but auth user creation failed
        setActionState(s => ({ ...s, [appId]: 'done' }));
        setActionMessages(m => ({ ...m, [appId]: data.warning ?? 'Partially completed — retry to finish user creation.' }));
      } else {
        setActionState(s => ({ ...s, [appId]: 'done' }));
        setActionMessages(m => ({ ...m, [appId]: `${action === 'approve' ? 'Approved' : action === 'deny' ? 'Denied' : 'Marked under review'} successfully.` }));
      }

      // Refresh after short delay so the user sees the success message
      setTimeout(() => startTransition(() => router.refresh()), 1200);
    } catch {
      setActionState(s => ({ ...s, [appId]: 'error' }));
      setActionMessages(m => ({ ...m, [appId]: 'Network error. Please try again.' }));
    }
  }

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeFilter === tab.key
                ? 'border-brand-blue-600 text-brand-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {statusCounts[tab.key] != null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeFilter === tab.key ? 'bg-brand-blue-100 text-brand-blue-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {statusCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          No applications with status <strong>{activeFilter}</strong>.
        </div>
      )}

      <div className="space-y-3">
        {applications.map(app => {
          const isExpanded = expandedId === app.id;
          const state = actionState[app.id] ?? 'idle';
          const msg = actionMessages[app.id];
          const canAct = ['pending', 'under_review'].includes(app.status);

          return (
            <div key={app.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : app.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{app.org_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ORG_TYPE_LABELS[app.org_type] ?? app.org_type} · {app.city}, {app.state} · {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-5 space-y-5">
                  {/* Contact + address */}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Contact</div>
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="font-medium">{app.contact_name}</span>
                        {app.contact_title && <span className="text-slate-400">· {app.contact_title}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Mail className="w-3.5 h-3.5" />{app.contact_email}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5" />{app.contact_phone}
                      </div>
                      {app.website && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Globe className="w-3.5 h-3.5" />
                          <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 hover:underline truncate">{app.website}</a>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide">Address</div>
                      <div className="flex items-start gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{app.address_line1}{app.address_line2 ? `, ${app.address_line2}` : ''}<br />{app.city}, {app.state} {app.zip}</span>
                      </div>
                      {app.ein && <div className="text-slate-500">EIN: {app.ein}</div>}
                    </div>
                  </div>

                  {/* Programs */}
                  <div className="text-sm">
                    <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-2">Programs</div>
                    <div className="flex flex-wrap gap-1.5">
                      {app.program_types.map(pt => (
                        <span key={pt} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full">{pt}</span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      {app.wioa_eligible && <span className="text-green-700 font-medium">✓ WIOA Eligible</span>}
                      {app.etpl_listed && <span className="text-green-700 font-medium">✓ ETPL Listed ({app.etpl_state})</span>}
                      {app.accreditation && <span>Accreditation: {app.accreditation}</span>}
                      {app.service_area && <span>Service area: {app.service_area}</span>}
                      {app.annual_enrollment != null && <span>~{app.annual_enrollment} enrolled/yr</span>}
                    </div>
                    {app.credential_authorities.length > 0 && (
                      <div className="mt-1.5 text-xs text-slate-500">
                        Credentials: {app.credential_authorities.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Narrative */}
                  {(app.mission_statement || app.outcomes_description || app.partnership_goals) && (
                    <div className="text-sm space-y-3">
                      {app.mission_statement && (
                        <div>
                          <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">Mission</div>
                          <p className="text-slate-600 leading-relaxed">{app.mission_statement}</p>
                        </div>
                      )}
                      {app.outcomes_description && (
                        <div>
                          <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">Outcomes</div>
                          <p className="text-slate-600 leading-relaxed">{app.outcomes_description}</p>
                        </div>
                      )}
                      {app.partnership_goals && (
                        <div>
                          <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">Partnership Goals</div>
                          <p className="text-slate-600 leading-relaxed">{app.partnership_goals}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing review notes (read-only for decided apps) */}
                  {app.review_notes && !canAct && (
                    <div className="text-sm bg-slate-50 rounded-lg p-3">
                      <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">Review Notes</div>
                      <p className="text-slate-600">{app.review_notes}</p>
                      {app.reviewed_at && (
                        <p className="text-xs text-slate-400 mt-1">Reviewed {new Date(app.reviewed_at).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {/* Tenant link for approved */}
                  {app.tenant_id && (
                    <div className="text-sm">
                      <a
                        href={`/admin/providers/${app.tenant_id}`}
                        className="text-brand-blue-600 hover:underline text-sm font-medium"
                      >
                        View provider tenant →
                      </a>
                    </div>
                  )}

                  {/* Action panel — only for actionable statuses */}
                  {canAct && (
                    <div className="border-t border-slate-100 pt-4 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Review Notes (optional)</label>
                        <textarea
                          value={reviewNotes[app.id] ?? ''}
                          onChange={e => setReviewNotes(n => ({ ...n, [app.id]: e.target.value }))}
                          rows={2}
                          placeholder="Internal notes or reason for decision…"
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
                        />
                      </div>

                      {msg && (
                        <div className={`text-sm px-3 py-2 rounded-lg ${
                          state === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {msg}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {app.status === 'pending' && (
                          <button
                            onClick={() => submitAction(app.id, 'under_review')}
                            disabled={state === 'loading'}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                          >
                            <Clock className="w-4 h-4" /> Mark Under Review
                          </button>
                        )}
                        <button
                          onClick={() => submitAction(app.id, 'approve')}
                          disabled={state === 'loading'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Approve
                        </button>
                        <button
                          onClick={() => submitAction(app.id, 'deny')}
                          disabled={state === 'loading'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {state === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Deny
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
