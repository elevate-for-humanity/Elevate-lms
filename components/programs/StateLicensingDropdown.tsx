'use client';

import { useState } from 'react';
import { ExternalLink, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import type { StateLicensingInfo } from '@/data/state-licensing';

interface Props {
  states: StateLicensingInfo[];
  programName: string;
}

export default function StateLicensingDropdown({ states, programName }: Props) {
  const [selected, setSelected] = useState<string>('');
  const info = states.find(s => s.code === selected);

  const sorted = [...states].sort((a, b) => {
    // Indiana first, then available states, then unavailable
    if (a.code === 'IN') return -1;
    if (b.code === 'IN') return 1;
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return a.state.localeCompare(b.state);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-lg font-extrabold text-slate-900 mb-1">State Licensing Requirements</h3>
      <p className="text-slate-500 text-sm mb-4">
        Select your state to see whether you can train and work as a {programName} there.
      </p>

      {/* Dropdown */}
      <div className="relative mb-4">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue-400 cursor-pointer"
        >
          <option value="">— Select your state —</option>
          {sorted.map(s => (
            <option key={s.code} value={s.code}>
              {s.state} {s.available ? '✓' : '✗'}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {/* Result */}
      {info && (
        <div className={`rounded-xl border-2 p-5 space-y-3 ${info.available ? 'border-brand-green-400 bg-brand-green-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-center gap-2">
            {info.available
              ? <CheckCircle className="w-5 h-5 text-brand-green-600 shrink-0" />
              : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
            }
            <span className={`font-bold text-base ${info.available ? 'text-brand-green-800' : 'text-red-700'}`}>
              {info.available
                ? `Training available for ${info.state} residents`
                : `Not available for ${info.state} residents`
              }
            </span>
          </div>

          {!info.available && info.unavailableReason && (
            <p className="text-red-700 text-sm leading-relaxed">{info.unavailableReason}</p>
          )}

          <div className="bg-white/70 rounded-lg p-3 text-sm text-slate-700 space-y-1">
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-1">Licensing Board</p>
            <p>{info.boardName}</p>
            <p className="text-slate-500 text-xs mt-1">{info.notes}</p>
          </div>

          <a
            href={info.requirementsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-600 hover:text-brand-blue-800 transition-colors"
          >
            View {info.state} official requirements
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {info.available && (
            <div className="pt-1">
              <a
                href="/apply?program=cna&track=self-pay"
                className="inline-block bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Apply Now
              </a>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-slate-400">
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-brand-green-500" /> Training available</span>
        <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400" /> Not available from Indiana</span>
      </div>
    </div>
  );
}
