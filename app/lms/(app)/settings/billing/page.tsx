'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  DollarSign,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  ExternalLink,
CheckCircle, } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiry?: string;
  is_default: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  description: string;
  invoice_url?: string;
}

export default function BillingSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login?redirect=/lms/settings/billing');
      return;
    }

    try {
      // Fetch payment methods from database
      const { data: methods, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (methodsError && methodsError.code !== 'PGRST116') {
        console.error('Error fetching payment methods:', methodsError);
      }

      // Fetch invoices from database
      const { data: invoiceData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      if (invoicesError && invoicesError.code !== 'PGRST116') {
        console.error('Error fetching invoices:', invoicesError);
      }

      // Fetch balance from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_balance')
        .eq('id', user.id)
        .single();

      setPaymentMethods(methods || []);
      setInvoices(invoiceData || []);
      setBalance(profile?.account_balance || 0);
    } catch (err) {
      console.error('Error loading billing data:', err);
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error opening billing portal:', err);
      alert('Failed to open billing portal');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'LMS', href: '/lms' }, { label: 'Settings', href: '/lms/settings' }, { label: 'Billing' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Payments</h1>

        {error && (
          <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-4 mb-6">
            <p className="text-brand-red-700">{error}</p>
          </div>
        )}

        {/* Account Balance */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Account Balance</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">${balance.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-brand-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-brand-green-600" />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Payment Methods</h2>
            <button
              onClick={handleManageBilling}
              className="inline-flex items-center gap-2 text-brand-blue-600 hover:underline text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Method
            </button>
          </div>

          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {method.brand || 'Card'} •••• {method.last4}
                      </p>
                      {method.expiry && (
                        <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.is_default && (
                      <span className="px-2 py-1 bg-brand-green-100 text-brand-green-700 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No payment methods on file</p>
              <button
                onClick={handleManageBilling}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Payment Method
              </button>
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>

          {invoices.length > 0 ? (
            <div className="divide-y">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.description}</p>
                    <p className="text-sm text-gray-500">{formatDate(invoice.date)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid'
                        ? 'bg-brand-green-100 text-brand-green-700'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-brand-red-100 text-brand-red-700'
                    }`}>
                      {invoice.status === 'paid' && <span className="text-slate-400 flex-shrink-0">•</span>}
                      {invoice.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <span className="font-semibold text-gray-900">${invoice.amount.toFixed(2)}</span>
                    {invoice.invoice_url && (
                      <a
                        href={invoice.invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No billing history yet</p>
            </div>
          )}
        </div>

        {/* Manage Billing */}
        <div className="mt-6 text-center">
          <button
            onClick={handleManageBilling}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Manage Billing
            <ExternalLink className="w-4 h-4" />
          </button>
          <p className="text-xs text-gray-500 mt-2">Opens Stripe billing portal</p>
        </div>
      </div>
    </div>
  );
}
