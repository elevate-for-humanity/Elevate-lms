'use client';

import { useState } from 'react';
import { RefreshCw, Database, AlertTriangle } from 'lucide-react';

export function DemoStartButtons() {
  const [seeding, setSeeding] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/demo/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Demo data seeded successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to seed demo data' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error while seeding' });
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('This will delete all demo data and re-seed. Continue?')) return;
    
    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Demo data reset successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset demo data' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error while resetting' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-16">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900">Demo Admin Controls</h3>
          <p className="text-sm text-amber-700">
            These controls manage the demo environment data. Use with caution.
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSeed}
          disabled={seeding || resetting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Database className={`w-4 h-4 ${seeding ? 'animate-pulse' : ''}`} />
          {seeding ? 'Seeding...' : 'Seed Demo Data'}
        </button>
        
        <button
          onClick={handleReset}
          disabled={seeding || resetting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          {resetting ? 'Resetting...' : 'Reset Demo'}
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-brand-green-100 text-brand-green-800' 
            : 'bg-brand-red-100 text-brand-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
