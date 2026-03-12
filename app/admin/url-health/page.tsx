'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function URLHealthPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/ecosystem/url-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-scan' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResults(data.result);
    } catch (err: any) {
      setError('URL health check failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/admin-url-health-hero.jpg" alt="URL Health Monitor" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'URL Health' }]} />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">URL Health Monitor</h1>
        <p className="text-gray-600 mb-6">Scan all site URLs for broken links and errors.</p>

        <button
          onClick={runCheck}
          disabled={running}
          className="flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50 mb-8"
        >
          {running ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          {running ? 'Scanning...' : 'Run Health Check'}
        </button>

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
