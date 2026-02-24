'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Send } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createBrowserClient } from '@supabase/ssr';
export default function ComplianceReportPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('compliance_audits').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [formData, setFormData] = useState({ type: '', description: '', anonymous: false });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <span className="text-slate-400 flex-shrink-0">•</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted</h1>
          <p className="text-gray-600 mb-6">Thank you for your report. Our compliance team will review it promptly.</p>
          <Link href="/" className="text-brand-blue-600 font-medium">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Compliance', href: '/compliance' }, { label: 'Report' }]} />
        </div>
      </div>

      <div className="bg-brand-red-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl font-bold mb-2">Submit a Compliance Report</h1>
          <p className="text-brand-red-100">Report concerns about safety, ethics, or policy violations</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Type *</label>
              <select required value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red-500">
                <option value="">Select type</option>
                <option value="safety">Safety Concern</option>
                <option value="harassment">Harassment/Discrimination</option>
                <option value="fraud">Fraud/Financial</option>
                <option value="policy">Policy Violation</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea required rows={6} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Please provide details about your concern..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red-500 resize-none" />
            </div>
            <label className="flex items-center">
              <input type="checkbox" checked={formData.anonymous} onChange={(e) => setFormData({...formData, anonymous: e.target.checked})}
                className="w-4 h-4 text-brand-red-600 border-gray-300 rounded" />
              <span className="ml-2 text-gray-700">Submit anonymously</span>
            </label>
            <button type="submit" className="w-full bg-brand-red-600 hover:bg-brand-red-700 text-white py-4 rounded-lg font-bold transition flex items-center justify-center">
              <Send className="w-5 h-5 mr-2" />Submit Report
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
