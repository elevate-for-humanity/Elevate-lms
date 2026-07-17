'use client';

import { useState } from 'react';
import { DollarSign, RefreshCw, CheckCircle, AlertCircle, ExternalLink, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
}

export default function QuickBooksClient() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  const connectQuickBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/quickbooks/connect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          setConnected(true);
          fetchInvoices();
        }
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
    setLoading(false);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/quickbooks/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setTotalRevenue(data.totalRevenue || 0);
        setPendingAmount(data.pendingAmount || 0);
        setConnected(true);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Paid</span>;
      case 'overdue':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"><AlertCircle className="w-3 h-3" /> Overdue</span>;
      case 'sent':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Sent</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">Draft</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">QuickBooks Integration</h1>
        {connected && (
          <button
            onClick={fetchInvoices}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="text-xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="text-xl font-bold text-slate-900">${pendingAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${connected ? 'bg-green-100' : 'bg-slate-100'}`}>
            <DollarSign className={`w-6 h-6 ${connected ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="font-medium text-slate-900">QuickBooks Connection</h2>
            <p className="text-sm text-slate-500">
              {connected ? 'Connected to QuickBooks Online' : 'Connect your QuickBooks account'}
            </p>
          </div>
        </div>

        {!connected && (
          <button
            onClick={connectQuickBooks}
            disabled={loading}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect QuickBooks'}
          </button>
        )}

        {connected && (
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Recent Invoices</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Invoice</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Due Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No invoices found</td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-900 font-mono text-sm">{invoice.invoice_number}</td>
                        <td className="px-4 py-2 text-slate-600">{invoice.customer_name}</td>
                        <td className="px-4 py-2 text-slate-900 font-medium">${invoice.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-slate-500">{invoice.due_date}</td>
                        <td className="px-4 py-2">{getStatusBadge(invoice.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
