'use client';

import { useEffect, useState } from 'react';
import { Loader2, Wand2, Download, Clock3, Send } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type TimelineEvent = {
  id: string;
  action: string;
  resource_id: string | null;
  created_at: string;
};

export default function MinorityCertificationPanel() {
  const [businessName, setBusinessName] = useState(`${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`);
  const [ownerName, setOwnerName] = useState('Elizabeth Greene');
  const [ownerEthnicity, setOwnerEthnicity] = useState('Black / African American');
  const [ownerGender, setOwnerGender] = useState('Female');
  const [ownershipPercent, setOwnershipPercent] = useState('100%');
  const [taxId, setTaxId] = useState('');
  const [uei, setUei] = useState('');
  const [naicsCodes, setNaicsCodes] = useState('611430, 611519');
  const [businessAddress, setBusinessAddress] = useState('8888 Keystone Crossing, Suite 1300, Indianapolis, IN 46240');
  const [contactEmail, setContactEmail] = useState('info@elevateforhumanity.org');
  const [contactPhone, setContactPhone] = useState(PLATFORM_DEFAULTS.supportPhone);
  const [certifyingAgency, setCertifyingAgency] = useState('Indiana IOT MWBE');
  const [businessNarrative, setBusinessNarrative] = useState(`${PLATFORM_DEFAULTS.orgName} provides workforce development, credential training, and apprenticeship pathways serving underserved communities across Indiana.`);
  const [emailTo, setEmailTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [files, setFiles] = useState<Array<{ type: string; signedUrl: string | null }>>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadTimeline() {
    setTimelineLoading(true);
    try {
      const res = await fetch('/api/admin/certifications/minority/prefill');
      const data = await res.json();
      if (res.ok) {
        setTimeline(Array.isArray(data.events) ? data.events : []);
      }
    } finally {
      setTimelineLoading(false);
    }
  }

  useEffect(() => {
    loadTimeline();
  }, []);

  async function generateDraft() {
    setLoading(true);
    setError('');
    setSuccess('');
    setFiles([]);
    try {
      const res = await fetch('/api/admin/certifications/minority/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          ownerName,
          ownerEthnicity,
          ownerGender,
          ownershipPercent,
          taxId,
          uei,
          naicsCodes,
          businessAddress,
          contactEmail,
          contactPhone,
          certifyingAgency,
          businessNarrative,
          emailTo: emailTo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to generate draft');
      setFiles(Array.isArray(data.files) ? data.files : []);
      setSuccess('Minority certification application draft generated.');
      await loadTimeline();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h2 className="text-base font-bold text-slate-900">Minority Certification Auto-Fill</h2>
      <p className="text-xs text-slate-500">One-click draft for minority certification application (DOCX + PDF + optional SendGrid email).</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Business Name" />
        <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Owner Name" />
        <input value={ownerEthnicity} onChange={(e) => setOwnerEthnicity(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Owner Ethnicity" />
        <input value={ownerGender} onChange={(e) => setOwnerGender(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Owner Gender" />
        <input value={ownershipPercent} onChange={(e) => setOwnershipPercent(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Ownership %" />
        <input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Tax ID / EIN" />
        <input value={uei} onChange={(e) => setUei(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="UEI" />
        <input value={naicsCodes} onChange={(e) => setNaicsCodes(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="NAICS Codes" />
        <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="Business Address" />
        <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Contact Email" />
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Contact Phone" />
        <input value={certifyingAgency} onChange={(e) => setCertifyingAgency(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="Certifying Agency" />
        <textarea value={businessNarrative} onChange={(e) => setBusinessNarrative(e.target.value)} rows={4} className="border border-slate-300 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="Business Narrative" />
        <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm md:col-span-2" placeholder="Email generated package to (optional)" />
      </div>

      <button
        onClick={generateDraft}
        disabled={loading || !businessName.trim()}
        className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        Generate Minority Certification Draft
      </button>

      {files.length > 0 && (
        <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3 space-y-2">
          <div className="text-sm font-semibold text-fuchsia-800">Generated Files</div>
          <div className="flex flex-wrap gap-2">
            {files.map((f, idx) =>
              f.signedUrl ? (
                <a
                  key={`${f.type}-${idx}`}
                  href={f.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-fuchsia-300 px-2 py-1 text-xs text-fuchsia-800 hover:bg-white"
                >
                  <Download className="w-3 h-3" /> {f.type.toUpperCase()}
                </a>
              ) : (
                <span
                  key={`${f.type}-${idx}`}
                  className="inline-flex items-center gap-1 rounded border border-fuchsia-200 px-2 py-1 text-xs text-fuchsia-400 cursor-not-allowed"
                  title="File not available"
                >
                  <Download className="w-3 h-3" /> {f.type.toUpperCase()}
                </span>
              )
            )}
          </div>
        </div>
      )}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-emerald-700">{success}</div> : null}

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider inline-flex items-center gap-1">
          <Clock3 className="w-3.5 h-3.5" /> Minority Certification Timeline
        </div>
        <div className="max-h-44 overflow-auto divide-y divide-slate-100">
          {timelineLoading ? (
            <div className="px-3 py-3 text-sm text-slate-500 inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading timeline...
            </div>
          ) : timeline.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">No minority certification autofill events yet.</div>
          ) : (
            timeline.map((item) => (
              <div key={item.id} className="px-3 py-2">
                <div className="text-sm font-medium text-slate-800">{item.action}</div>
                <div className="text-xs text-slate-500">
                  {item.resource_id || '—'} · {new Date(item.created_at).toLocaleString('en-US')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 inline-flex items-center gap-2">
        <Send className="w-3.5 h-3.5" /> Sends through configured SendGrid provider when email is set.
      </div>
    </div>
  );
}
