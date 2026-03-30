'use client';

import { useState } from 'react';
import { Award, Plus, Trash2, Star } from 'lucide-react';
import BuilderSection from './BuilderSection';
import type { ProgramBuilderState, ProgramCredential } from './types';

interface AvailableCredential {
  id: string;
  name: string;
  abbreviation: string | null;
  issuing_authority: string;
}

interface Props {
  state: ProgramBuilderState;
  availableCredentials: AvailableCredential[];
  onChange: (patch: Partial<ProgramBuilderState>) => void;
}

export default function ProgramCertificationsSection({ state, onChange, availableCredentials }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const credentials = state.credentials;

  const attachCredential = () => {
    const cred = availableCredentials.find(c => c.id === selectedId);
    if (!cred) return;
    if (credentials.some(c => c.credential_id === cred.id)) return;

    const next: ProgramCredential = {
      id: crypto.randomUUID(),
      credential_id: cred.id,
      credential_name: cred.name,
      credential_abbreviation: cred.abbreviation,
      is_required: true,
      is_primary: credentials.length === 0, // first one is primary by default
      sort_order: credentials.length,
    };
    onChange({ credentials: [...credentials, next] });
    setSelectedId('');
  };

  const removeCredential = (id: string) => {
    const remaining = credentials.filter(c => c.id !== id);
    // If we removed the primary, promote the first remaining
    if (remaining.length > 0 && !remaining.some(c => c.is_primary)) {
      remaining[0] = { ...remaining[0], is_primary: true };
    }
    onChange({ credentials: remaining });
  };

  const setPrimary = (id: string) => {
    onChange({
      credentials: credentials.map(c => ({ ...c, is_primary: c.id === id })),
    });
  };

  const unattachedCredentials = availableCredentials.filter(
    ac => !credentials.some(c => c.credential_id === ac.id)
  );

  return (
    <BuilderSection
      title="Certifications & Credentials"
      description="Credentials learners earn upon completion. These appear on the public program page and on issued certificates."
      warning={
        credentials.length === 0
          ? 'No credentials attached. If this program leads to a certification, add it here. Programs without credentials have lower enrollment conversion.'
          : undefined
      }
    >
      <div className="space-y-3">
        {credentials.length === 0 && (
          <p className="text-sm text-slate-400 italic">No credentials attached yet.</p>
        )}

        {credentials.map(cred => (
          <div
            key={cred.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${cred.is_primary ? 'border-brand-blue-200 bg-brand-blue-50' : 'border-slate-200 bg-white'}`}
          >
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${cred.is_primary ? 'bg-brand-blue-600' : 'bg-slate-100'}`}>
              <Award className={`h-5 w-5 ${cred.is_primary ? 'text-white' : 'text-slate-500'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900 truncate">{cred.credential_name}</span>
                {cred.credential_abbreviation && (
                  <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                    {cred.credential_abbreviation}
                  </span>
                )}
                {cred.is_primary && (
                  <span className="flex-shrink-0 flex items-center gap-0.5 text-xs font-medium text-brand-blue-600">
                    <Star className="h-3 w-3 fill-current" /> Primary
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cred.is_required}
                    onChange={e => onChange({
                      credentials: credentials.map(c =>
                        c.id === cred.id ? { ...c, is_required: e.target.checked } : c
                      ),
                    })}
                    className="rounded"
                  />
                  Required for completion
                </label>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {!cred.is_primary && (
                <button
                  onClick={() => setPrimary(cred.id)}
                  className="rounded p-1.5 text-slate-400 hover:text-brand-blue-600 hover:bg-brand-blue-50 transition-colors"
                  title="Set as primary credential"
                >
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => removeCredential(cred.id)}
                className="rounded p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Remove credential"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Attach row */}
        {unattachedCredentials.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-500/20 bg-white"
            >
              <option value="">Select a credential to attach…</option>
              {unattachedCredentials.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.abbreviation ? ` (${c.abbreviation})` : ''} — {c.issuing_authority}
                </option>
              ))}
            </select>
            <button
              onClick={attachCredential}
              disabled={!selectedId}
              className="flex items-center gap-1.5 rounded-lg bg-brand-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-blue-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Attach
            </button>
          </div>
        )}

        {unattachedCredentials.length === 0 && credentials.length === 0 && (
          <p className="text-sm text-slate-400">
            No credentials exist in the registry yet.{' '}
            <a href="/admin/credentials" className="text-brand-blue-600 hover:underline">Add credentials →</a>
          </p>
        )}
      </div>
    </BuilderSection>
  );
}
