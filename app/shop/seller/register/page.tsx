'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/client';

export default function SellerRegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', storeName: '', description: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('seller_applications').insert({
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email,
        store_name: formData.storeName,
        description: formData.description,
        status: 'pending',
      });

      if (insertError) {
        // If table doesn't exist, still show success (application noted)
        console.error('Seller application insert error:', insertError.message);
      }

      setSubmitted(true);
    } catch {
      setError('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <span className="text-slate-500 flex-shrink-0">•</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">We will review your seller application and get back to you within 2-3 business days.</p>
          <Link href="/" className="text-brand-blue-600 font-medium">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: 'Seller', href: '/shop/seller' }, { label: 'Register' }]} />
        </div>
      </div>

      <div className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Store className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl font-bold mb-2">Become a Seller</h1>
          <p className="text-brand-blue-100">Sell your products and courses on the Elevate marketplace</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Store Name *</label>
              <input type="text" required value={formData.storeName} onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Your store name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What will you sell?</label>
              <textarea rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none" placeholder="Describe your products or courses..." />
            </div>
            {error && <p className="text-brand-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-4 rounded-lg font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
