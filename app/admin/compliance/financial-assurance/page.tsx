import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { 
  Shield, AlertTriangle, Clock, FileText, 
  Calendar, DollarSign, Building2, Plus, Download, Bell
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Financial Assurance | Admin | Elevate',
  description: 'Track bonds, letters of credit, and financial assurance requirements.',
};

export const dynamic = 'force-dynamic';

interface FinancialAssurance {
  id: string;
  type: 'surety_bond' | 'letter_of_credit' | 'escrow' | 'insurance';
  provider: string;
  amount: number;
  issue_date: string;
  expiration_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'pending';
  document_url?: string;
  notes?: string;
}

// Default data for demo
const defaultAssurances: FinancialAssurance[] = [
  {
    id: '1',
    type: 'surety_bond',
    provider: 'Indiana Surety Company',
    amount: 50000,
    issue_date: '2025-01-15',
    expiration_date: '2026-01-15',
    status: 'active',
    notes: 'Required for ETPL listing',
  },
  {
    id: '2',
    type: 'letter_of_credit',
    provider: 'First National Bank',
    amount: 25000,
    issue_date: '2025-06-01',
    expiration_date: '2026-02-28',
    status: 'expiring_soon',
    notes: 'Backup financial assurance',
  },
  {
    id: '3',
    type: 'insurance',
    provider: 'State Farm Business Insurance',
    amount: 1000000,
    issue_date: '2025-03-01',
    expiration_date: '2026-03-01',
    status: 'active',
    notes: 'General liability coverage',
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-brand-green-100 text-brand-green-700';
    case 'expiring_soon': return 'bg-yellow-100 text-yellow-700';
    case 'expired': return 'bg-brand-red-100 text-brand-red-700';
    case 'pending': return 'bg-brand-blue-100 text-brand-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'surety_bond': return 'Surety Bond';
    case 'letter_of_credit': return 'Letter of Credit';
    case 'escrow': return 'Escrow Account';
    case 'insurance': return 'Insurance Policy';
    default: return type;
  }
}

function getDaysUntilExpiration(date: string) {
  const expDate = new Date(date);
  const today = new Date();
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default async function FinancialAssurancePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  let assurances = defaultAssurances;
  
  if (supabase) {
    const { data } = await db
      .from('financial_assurances')
      .select('*')
      .order('expiration_date', { ascending: true });
    
    if (data && data.length > 0) {
      assurances = data;
    }
  }

  // Calculate stats
  const totalCoverage = assurances.reduce((sum, a) => sum + a.amount, 0);
  const activeCount = assurances.filter(a => a.status === 'active').length;
  const expiringCount = assurances.filter(a => a.status === 'expiring_soon').length;
  const expiredCount = assurances.filter(a => a.status === 'expired').length;

  // Find next expiration
  const nextExpiring = assurances
    .filter(a => a.status !== 'expired')
    .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())[0];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Financial Assurance" }]} />
      </div>
<div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/admin" className="hover:text-gray-700">Admin</Link>
              <span>/</span>
              <Link href="/admin/compliance" className="hover:text-gray-700">Compliance</Link>
              <span>/</span>
              <span className="text-gray-900">Financial Assurance</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Financial Assurance</h1>
            <p className="text-gray-600 mt-1">Track bonds, letters of credit, and insurance requirements</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {expiringCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Attention Required</h3>
              <p className="text-sm text-yellow-700">
                {expiringCount} financial assurance{expiringCount > 1 ? 's' : ''} expiring within 60 days. 
                Review and renew to maintain compliance.
              </p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Coverage</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalCoverage.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center">
                <span className="text-slate-400 flex-shrink-0">•</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">{expiringCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Renewal</p>
                <p className="text-lg font-bold text-gray-900">
                  {nextExpiring ? new Date(nextExpiring.expiration_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assurances Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Financial Assurances</h2>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                All
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Active
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Expiring
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assurances.map((assurance) => {
                  const daysUntil = getDaysUntilExpiration(assurance.expiration_date);
                  
                  return (
                    <tr key={assurance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {assurance.type === 'surety_bond' && <Shield className="w-5 h-5 text-gray-600" />}
                            {assurance.type === 'letter_of_credit' && <FileText className="w-5 h-5 text-gray-600" />}
                            {assurance.type === 'escrow' && <DollarSign className="w-5 h-5 text-gray-600" />}
                            {assurance.type === 'insurance' && <Building2 className="w-5 h-5 text-gray-600" />}
                          </div>
                          <span className="font-medium text-gray-900">{getTypeLabel(assurance.type)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {assurance.provider}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        ${assurance.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(assurance.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="text-gray-900">{new Date(assurance.expiration_date).toLocaleDateString()}</span>
                          {daysUntil > 0 && daysUntil <= 60 && (
                            <span className="block text-xs text-yellow-600">{daysUntil} days remaining</span>
                          )}
                          {daysUntil <= 0 && (
                            <span className="block text-xs text-brand-red-600">Expired</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assurance.status)}`}>
                          {assurance.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium">
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                            Edit
                          </button>
                          {assurance.status === 'expiring_soon' && (
                            <button className="text-brand-orange-600 hover:text-brand-orange-700 text-sm font-medium">
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Requirements */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">State Requirements</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700">Indiana ETPL Surety Bond</span>
                </div>
                <span className="text-sm text-brand-green-600 font-medium">Compliant</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700">General Liability Insurance</span>
                </div>
                <span className="text-sm text-brand-green-600 font-medium">Compliant</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="text-gray-700">Workers Compensation</span>
                </div>
                <span className="text-sm text-brand-green-600 font-medium">Compliant</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Renewals</h3>
            <div className="space-y-3">
              {assurances
                .filter(a => a.status !== 'expired')
                .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())
                .slice(0, 3)
                .map((assurance) => {
                  const daysUntil = getDaysUntilExpiration(assurance.expiration_date);
                  return (
                    <div key={assurance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{getTypeLabel(assurance.type)}</span>
                        <span className="block text-sm text-gray-500">{assurance.provider}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${daysUntil <= 30 ? 'text-brand-red-600' : daysUntil <= 60 ? 'text-yellow-600' : 'text-gray-600'}`}>
                          {daysUntil} days
                        </span>
                        <span className="block text-xs text-gray-500">
                          {new Date(assurance.expiration_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mt-8 bg-brand-blue-50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Renewal Reminders</h3>
              <p className="text-sm text-gray-600 mt-1">
                Get notified 90, 60, and 30 days before your financial assurances expire.
              </p>
              <button className="mt-3 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-medium">
                Configure Notifications →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
