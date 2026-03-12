'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Loader2, Zap } from 'lucide-react';

export default function ContentAutomationPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('refresh');

  const runAutomation = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/ecosystem/content-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Automation failed');
      setResults(data.result);
    } catch (err: any) {
      setError('Content automation failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-content-automation-hero.jpg" alt="Content automation" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Content Automation' }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Automation</h1>
        <p className="text-gray-600 mb-6">Automated content refresh, optimization, and publishing pipeline.</p>

        <div className="flex items-center gap-4 mb-8">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="refresh">Content Refresh</option>
            <option value="optimize">SEO Optimization</option>
            <option value="publish">Auto-Publish Queue</option>
            <option value="audit">Content Audit</option>
          </select>

          <button
            onClick={runAutomation}
            disabled={running}
            className="flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {running ? 'Running...' : 'Run Automation'}
          </button>
        </div>

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Results</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
