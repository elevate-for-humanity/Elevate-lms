'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Plus,
  FolderOpen,
} from 'lucide-react';

const documents = [
  { id: 1, name: 'Host Shop Agreement', type: 'agreement', status: 'active', uploadedAt: '2025-01-15', size: '245 KB' },
  { id: 2, name: 'Apprenticeship Contract - Marcus Johnson', type: 'contract', status: 'active', uploadedAt: '2025-03-10', size: '180 KB' },
  { id: 3, name: 'Business License', type: 'license', status: 'expiring', uploadedAt: '2025-01-01', size: '120 KB' },
  { id: 4, name: 'Supervisor License - Jane Doe', type: 'license', status: 'active', uploadedAt: '2025-02-20', size: '95 KB' },
  { id: 5, name: 'Insurance Certificate', type: 'insurance', status: 'expiring', uploadedAt: '2025-01-05', size: '310 KB' },
  { id: 6, name: 'Safety Policies', type: 'policy', status: 'active', uploadedAt: '2025-01-01', size: '520 KB' },
];

const statusConfig = {
  active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Valid' },
  expiring: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Expiring Soon' },
  expired: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', label: 'Expired' },
};

export default function DocumentsPage() {
  const [filter, setFilter] = useState<string>('all');

  const filteredDocs = filter === 'all' 
    ? documents 
    : documents.filter(d => d.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/host-shop/dashboard" className="w-10 h-10 bg-gradient-to-br from-brand-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </Link>
              <div>
                <p className="font-bold text-slate-900">Elevate</p>
                <p className="text-xs text-slate-500">Documents</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-xl font-medium hover:bg-brand-blue-700 transition">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Documents</h1>
          <p className="text-slate-500">Manage your shop documents, licenses, and agreements</p>
        </div>

        {/* Alerts */}
        {documents.filter(d => d.status === 'expiring').length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">
                {documents.filter(d => d.status === 'expiring').length} document(s) expiring soon
              </p>
              <p className="text-sm text-amber-700">Please update these documents before they expire</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all' ? 'bg-brand-blue-100 text-brand-blue-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'active' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active ({documents.filter(d => d.status === 'active').length})
            </button>
            <button
              onClick={() => setFilter('expiring')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'expiring' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Expiring ({documents.filter(d => d.status === 'expiring').length})
            </button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const status = statusConfig[doc.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;
            
            return (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {status.label}
                  </span>
                </div>
                
                <h3 className="font-semibold text-slate-900 mb-1">{doc.name}</h3>
                <p className="text-sm text-slate-500 mb-4 capitalize">{doc.type.replace('_', ' ')}</p>
                
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {doc.uploadedAt}
                  </span>
                  <span>{doc.size}</span>
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredDocs.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No documents found</h3>
            <p className="text-sm text-slate-500 mb-4">Upload your first document to get started</p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-xl font-medium hover:bg-brand-blue-700 transition">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
