'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Participant {
  id: string;
  user_id: string;
  course_id: string;
  completed_at: string | null;
  profiles: { full_name: string; email: string } | null;
  courses: { title: string } | null;
}

export default function BulkIssueForm({
  templates,
  eligibleParticipants,
  eligibleCount,
}: {
  templates: { id: string; name: string; description: string }[];
  eligibleParticipants: Participant[];
  eligibleCount: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [signedBy, setSignedBy] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  const toggleAll = () => {
    if (selected.size === eligibleParticipants.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligibleParticipants.map(p => p.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleIssue = async () => {
    if (selected.size === 0) { setError('Select at least one participant'); return; }
    if (!templateId) { setError('Select a certificate template'); return; }

    setIssuing(true);
    setError('');

    try {
      const res = await fetch('/api/admin/certificates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentIds: Array.from(selected),
          templateId,
          issueDate,
          signedBy: signedBy || 'Elevate for Humanity Career & Technical Institute',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk issuance failed');
      setResult({ success: data.issued || 0, failed: data.failed || 0 });
    } catch (err: any) {
      setError('Failed to issue certificates. Please try again.');
    } finally {
      setIssuing(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <CheckCircle className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Certificates Issued</h2>
        <p className="text-gray-600 mb-4">{result.success} issued, {result.failed} failed</p>
        <button onClick={() => router.push('/admin/certificates')}
          className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700">
          View All Certificates
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Template *</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500">
                <option value="">Select a template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signed By</label>
              <input type="text" value={signedBy} onChange={e => setSignedBy(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                placeholder="Director Name" />
            </div>

            {error && (
              <div className="p-3 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-brand-red-600 mt-0.5" />
                <p className="text-brand-red-700 text-sm">{error}</p>
              </div>
            )}

            <button onClick={handleIssue} disabled={issuing || selected.size === 0}
              className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
              {issuing ? <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</> : `Issue ${selected.size} Certificate${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>

        <div className="bg-brand-blue-50 rounded-lg p-4 mt-4">
          <h3 className="font-medium text-brand-blue-900">Eligible Participants</h3>
          <p className="text-3xl font-bold text-brand-blue-600 mt-1">{eligibleCount}</p>
          <p className="text-sm text-brand-blue-700">Ready for certificate issuance</p>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Eligible Participants</h2>
              <p className="text-sm text-gray-500">{selected.size} of {eligibleParticipants.length} selected</p>
            </div>
            <button onClick={toggleAll} className="text-sm text-brand-blue-600 hover:text-brand-blue-800">
              {selected.size === eligibleParticipants.length ? 'Clear All' : 'Select All'}
            </button>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {eligibleParticipants.length > 0 ? (
              eligibleParticipants.map((e) => (
                <div key={e.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer" onClick={() => toggle(e.id)}>
                  <input type="checkbox" checked={selected.has(e.id)} readOnly className="w-4 h-4 text-brand-blue-600 rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{e.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{e.profiles?.email}</p>
                    <p className="text-sm text-brand-blue-600">{e.courses?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-sm font-medium">{e.completed_at ? new Date(e.completed_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No eligible participants found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
