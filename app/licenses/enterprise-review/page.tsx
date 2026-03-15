'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function EnterpriseReviewPage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    contactName: '',
    title: '',
    email: '',
    phone: '',
    organizationType: '',
    useCase: '',
    technicalCapability: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const response = await fetch('/api/licenses/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, licenseType: 'source_use' }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Request Submitted</h1>
          <p className="text-gray-400 mb-8">
            Your enterprise review request has been received. Our team will evaluate your request 
            and contact you within 5 business days. Source-use licenses require approval and a 
            signed agreement before any access is granted.
          </p>
          <Link href="/store/licensing" className="text-brand-blue-400 font-semibold hover:underline">
            Return to Platform Licensing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-16 px-4">
      <Breadcrumbs
        items={[
          { label: 'Licenses', href: '/licenses' },
          { label: 'Enterprise Review' },
        ]}
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          Request Enterprise Review
        </h1>
        <p className="text-gray-400 mb-4">
          Enterprise Source-Use License — Starting at $75,000
        </p>
        <p className="text-gray-500 mb-8 text-sm">
          This license grants internal use of source code only. It does not include ownership, 
          rebranding rights, resale rights, credential authority, or managed hosting. 
          All requests require enterprise approval.
        </p>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Contact Name *
              </label>
              <input
                type="text"
                required
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Phone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Organization Type *
            </label>
            <select
              required
              value={formData.organizationType}
              onChange={(e) => setFormData({ ...formData, organizationType: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            >
              <option value="">Select...</option>
              <option value="government">Government Agency</option>
              <option value="enterprise">Enterprise (500+ employees)</option>
              <option value="university">University / Higher Education</option>
              <option value="healthcare_system">Healthcare System</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Intended Use Case *
            </label>
            <textarea
              rows={3}
              required
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              placeholder="Describe how your organization intends to use the source code..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Technical Capability *
            </label>
            <select
              required
              value={formData.technicalCapability}
              onChange={(e) => setFormData({ ...formData, technicalCapability: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            >
              <option value="">Select...</option>
              <option value="internal_team">Internal development team</option>
              <option value="contracted">Contracted development partner</option>
              <option value="hybrid">Hybrid (internal + contracted)</option>
              <option value="exploring">Still evaluating</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Additional Information
            </label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any additional context for your request..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            />
          </div>

          <div className="bg-gray-700 rounded-lg p-4 text-sm text-gray-300">
            <p className="font-semibold mb-2">By submitting this request, you acknowledge:</p>
            <ul className="space-y-1 text-gray-400">
              <li>• Source-use licenses do not grant ownership</li>
              <li>• Rebranding and resale are not permitted</li>
              <li>• Approval and signed agreement required before access</li>
              <li>• Pricing starts at $75,000</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            {status === 'submitting' ? 'Submitting...' : 'Submit Enterprise Review Request'}
          </button>

          {status === 'error' && (
            <p className="text-brand-red-400 text-center">Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
}
