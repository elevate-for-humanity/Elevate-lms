'use client';

import { useState } from 'react';
import { Loader2, Upload, CheckCircle } from 'lucide-react';

type Template = {
  id: string;
  name: string;
  description: string;
};

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
  eligibleParticipants = [],
  eligibleCount = 0,
}: {
  templates: Template[];
  eligibleParticipants?: Participant[];
  eligibleCount?: number;
}) {
  const [templateId, setTemplateId] = useState('');
  const [csvData, setCsvData] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId || !csvData) {
      setError('Please select a template and provide CSV data.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/certificates/bulk-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, recipients: csvData }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: data.success || 0, failed: data.failed || 0 });
        setCsvData('');
      } else {
        setError(data.error || 'Failed to issue certificates');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Certificate Template</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
          required
        >
          <option value="">Select a template...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Recipients (CSV format: name,email)
        </label>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder="John Doe,john@example.com
Jane Smith,jane@example.com"
          rows={6}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm"
          required
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      {result && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>{result.success} certificates issued, {result.failed} failed.</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {loading ? 'Issuing...' : 'Issue Certificates'}
      </button>
    </form>
  );
}
