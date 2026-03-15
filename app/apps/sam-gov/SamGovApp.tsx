'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Building2, Bell, Settings, Plus, Upload, Download, RefreshCw,
  Clock, AlertTriangle, ChevronRight, X, FileText
} from 'lucide-react';

interface Props {
  user: any;
  subscription: any;
  entities: any[];
  documents: any[];
  alerts: any[];
  trialDaysRemaining: number;
}

export function SamGovApp({ user, subscription, entities: initialEntities, documents, alerts, trialDaysRemaining }: Props) {
  const [entities, setEntities] = useState(initialEntities);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entities' | 'compliance' | 'documents'>('dashboard');
  const [showNewModal, setShowNewModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const createEntity = async (name: string) => {
    if (!supabase) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('sam_entities')
      .insert({ user_id: user.id, legal_name: name, registration_status: 'draft', current_step: 1 })
      .select()
      .single();

    if (!error && data) {
      setEntities(prev => [data, ...prev]);
      setShowNewModal(false);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Trial Banner */}
      {subscription.status === 'trial' && trialDaysRemaining > 0 && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          Trial: {trialDaysRemaining} days remaining. 
          <Link href="/store/apps/sam-gov?upgrade=true" className="underline ml-2">Upgrade now</Link>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-brand-blue-900" />
            </div>
            <div>
              <h1 className="font-bold">SAM.gov Assistant</h1>
              <p className="text-brand-blue-200 text-sm">Registration & Compliance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {alerts.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red-500 rounded-full text-xs flex items-center justify-center">{alerts.length}</span>
              </div>
            )}
            <Link href="/apps/sam-gov" className="p-2 hover:bg-brand-blue-800 rounded-lg">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {['dashboard', 'entities', 'compliance', 'documents'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg ${activeTab === tab ? 'bg-white text-brand-blue-900' : 'text-brand-blue-200 hover:bg-brand-blue-800'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Total Entities</span>
                  <Building2 className="w-5 h-5 text-brand-blue-500" />
                </div>
                <p className="text-3xl font-bold">{entities.length}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Active</span>
                  <span className="text-slate-400 flex-shrink-0">•</span>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">{entities.filter(e => e.registration_status === 'active').length}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Pending</span>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{entities.filter(e => ['pending', 'draft'].includes(e.registration_status)).length}</p>
              </div>
              <div className="bg-white rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">Alerts</span>
                  <AlertTriangle className="w-5 h-5 text-brand-red-500" />
                </div>
                <p className="text-3xl font-bold text-brand-red-600">{alerts.length}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-4 gap-4">
              <button onClick={() => setShowNewModal(true)} className="bg-white rounded-xl p-6 border hover:shadow-lg transition text-left">
                <Plus className="w-8 h-8 text-brand-blue-600 mb-3" />
                <h3 className="font-bold">New Registration</h3>
                <p className="text-sm text-gray-500 mt-1">Start a new SAM.gov registration</p>
              </button>
              <button className="bg-white rounded-xl p-6 border hover:shadow-lg transition text-left">
                <Upload className="w-8 h-8 text-brand-green-600 mb-3" />
                <h3 className="font-bold">Import Data</h3>
                <p className="text-sm text-gray-500 mt-1">Import from CSV or SAM.gov</p>
              </button>
              <button className="bg-white rounded-xl p-6 border hover:shadow-lg transition text-left">
                <RefreshCw className="w-8 h-8 text-brand-blue-600 mb-3" />
                <h3 className="font-bold">Sync SAM.gov</h3>
                <p className="text-sm text-gray-500 mt-1">Update from SAM.gov API</p>
              </button>
              <button className="bg-white rounded-xl p-6 border hover:shadow-lg transition text-left">
                <Download className="w-8 h-8 text-brand-orange-600 mb-3" />
                <h3 className="font-bold">Export Data</h3>
                <p className="text-sm text-gray-500 mt-1">Download registration data</p>
              </button>
            </div>

            {/* Entity List */}
            <div className="bg-white rounded-xl border">
              <div className="p-4 border-b">
                <h2 className="font-bold">Your Entities</h2>
              </div>
              {entities.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold mb-2">No entities yet</h3>
                  <p className="text-gray-500 mb-4">Start by creating a new SAM.gov registration</p>
                  <button onClick={() => setShowNewModal(true)} className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg">
                    Create First Entity
                  </button>
                </div>
              ) : (
                <div className="divide-y">
                  {entities.map(entity => (
                    <Link key={entity.id} href={`/apps/sam-gov/entity/${entity.id}`} className="p-4 hover:bg-white flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{entity.legal_name}</h3>
                        <p className="text-sm text-gray-500">{entity.uei || 'UEI not assigned'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          entity.registration_status === 'active' ? 'bg-brand-green-100 text-brand-green-800' :
                          entity.registration_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-white text-gray-800'
                        }`}>
                          {entity.registration_status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'entities' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">All Entities</h2>
            {entities.length === 0 ? (
              <p className="text-gray-500">No entities. Create one from the dashboard.</p>
            ) : (
              <div className="space-y-4">
                {entities.map(entity => (
                  <Link key={entity.id} href={`/apps/sam-gov/entity/${entity.id}`} className="block p-4 border rounded-lg hover:bg-white">
                    <h3 className="font-bold">{entity.legal_name}</h3>
                    <p className="text-sm text-gray-500">Status: {entity.registration_status} | Step: {entity.current_step}/7</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">Compliance Dashboard</h2>
            {entities.length === 0 ? (
              <p className="text-gray-500">No entities to monitor.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {entities.map(entity => (
                  <div key={entity.id} className="border rounded-lg p-4">
                    <h3 className="font-bold">{entity.legal_name}</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className={entity.registration_status === 'active' ? 'text-brand-green-600' : 'text-yellow-600'}>{entity.registration_status}</span>
                      </div>
                      {entity.sam_expiration_date && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Expires</span>
                          <span>{new Date(entity.sam_expiration_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">{doc.document_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New Entity Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">New Entity</h3>
              <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const name = (e.target as any).legalName.value; createEntity(name); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Legal Business Name</label>
                <input name="legalName" required className="w-full px-4 py-3 border rounded-lg" placeholder="Enter legal business name" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-brand-blue-600 text-white rounded-lg disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
