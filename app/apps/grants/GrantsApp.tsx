'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  DollarSign, Bell, Settings, Search, Plus, Download, RefreshCw,
  Calendar, Bookmark, FileText, ChevronRight, Star, Filter
} from 'lucide-react';

interface Props {
  user: any;
  subscription: any;
  opportunities: any[];
  savedGrants: any[];
  applications: any[];
  trialDaysRemaining: number;
}

export function GrantsApp({ user, subscription, opportunities, savedGrants, applications, trialDaysRemaining }: Props) {
  const [activeTab, setActiveTab] = useState<'discover' | 'saved' | 'applications' | 'calendar'>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  const filteredOpportunities = opportunities.filter(opp => 
    !searchQuery || opp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.agency?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const saveGrant = async (grantId: string) => {
    if (!supabase) return;
    await supabase.from('user_saved_grants').insert({ user_id: user.id, grant_id: grantId });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Trial Banner */}
      {subscription.status === 'trial' && trialDaysRemaining > 0 && (
        <div className="bg-white text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          Trial: {trialDaysRemaining} days remaining. 
          <Link href="/store/apps/grants?upgrade=true" className="underline ml-2">Upgrade now</Link>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-brand-green-800" />
            </div>
            <div>
              <h1 className="font-bold">Grants Discovery</h1>
              <p className="text-white text-sm">Find & Manage Funding</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/apps/grants" className="p-2 hover:bg-brand-green-700 rounded-lg">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {['discover', 'saved', 'applications', 'calendar'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-medium rounded-t-lg ${activeTab === tab ? 'bg-white text-brand-green-900' : 'text-white hover:bg-brand-green-700'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'discover' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search grants..."
                  className="w-full pl-12 pr-4 py-3 border rounded-lg"
                />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className="px-4 py-3 border rounded-lg flex items-center gap-2">
                <Filter className="w-5 h-5" /> Filters
              </button>
              <button className="px-4 py-3 bg-brand-green-600 text-white rounded-lg flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Sync Grants.gov
              </button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-gray-500 text-sm">Available Grants</p>
                <p className="text-2xl font-bold text-brand-green-600">{opportunities.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-gray-500 text-sm">Saved</p>
                <p className="text-2xl font-bold text-brand-blue-600">{savedGrants.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-gray-500 text-sm">Applications</p>
                <p className="text-2xl font-bold text-brand-blue-600">{applications.length}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <p className="text-gray-500 text-sm">Closing Soon</p>
                <p className="text-2xl font-bold text-brand-orange-600">
                  {opportunities.filter(o => {
                    const deadline = new Date(o.deadline);
                    const daysUntil = (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
                    return daysUntil <= 30 && daysUntil > 0;
                  }).length}
                </p>
              </div>
            </div>

            {/* Grant List */}
            <div className="space-y-4">
              {filteredOpportunities.length === 0 ? (
                <div className="bg-white rounded-xl border p-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold mb-2">No grants found</h3>
                  <p className="text-gray-500">Try adjusting your search or sync from Grants.gov</p>
                </div>
              ) : (
                filteredOpportunities.map(grant => (
                  <div key={grant.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">{grant.category}</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{grant.title}</h3>
                        <p className="text-gray-600 mb-3">{grant.agency}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-brand-green-600 font-medium">
                            {grant.amount_min && grant.amount_max 
                              ? `${formatCurrency(grant.amount_min)} - ${formatCurrency(grant.amount_max)}`
                              : 'Amount varies'}
                          </span>
                          {grant.deadline && (
                            <span className="text-gray-500">
                              Deadline: {new Date(grant.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => saveGrant(grant.id)}
                          className="p-2 rounded-lg hover:bg-white"
                        >
                          <Bookmark className="w-5 h-5 text-gray-400" />
                        </button>
                        <Link 
                          href={`/apps/grants/opportunity/${grant.id}`}
                          className="px-4 py-2 bg-brand-green-600 text-white rounded-lg text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">Saved Grants</h2>
            {savedGrants.length === 0 ? (
              <p className="text-gray-500">No saved grants yet. Browse and save grants you're interested in.</p>
            ) : (
              <div className="space-y-4">
                {savedGrants.map(saved => (
                  <div key={saved.id} className="p-4 border rounded-lg">
                    <h3 className="font-bold">{saved.grant?.title || 'Grant'}</h3>
                    <p className="text-sm text-gray-500">{saved.grant?.agency}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">My Applications</h2>
              <button className="px-4 py-2 bg-brand-green-600 text-white rounded-lg flex items-center gap-2">
                <Plus className="w-5 h-5" /> New Application
              </button>
            </div>
            {applications.length === 0 ? (
              <p className="text-gray-500">No applications yet. Start by applying to a grant.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <Link key={app.id} href={`/apps/grants/application/${app.id}`} className="block p-4 border rounded-lg hover:bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{app.grant_title}</h3>
                        <p className="text-sm text-gray-500">{app.agency} • {formatCurrency(app.requested_amount || 0)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === 'awarded' ? 'bg-brand-green-100 text-brand-green-800' :
                          app.status === 'submitted' ? 'bg-brand-blue-100 text-brand-blue-800' :
                          app.status === 'draft' ? 'bg-white text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {app.status}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    {app.status === 'draft' && (
                      <div className="mt-2">
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-white rounded-full" style={{ width: `${app.progress || 0}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{app.progress || 0}% complete</p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-4">Upcoming Deadlines</h2>
            <div className="space-y-4">
              {opportunities
                .filter(o => o.deadline && new Date(o.deadline) > new Date())
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 10)
                .map(grant => {
                  const deadline = new Date(grant.deadline);
                  const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={grant.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        daysUntil <= 7 ? 'bg-brand-red-100 text-brand-red-600' :
                        daysUntil <= 30 ? 'bg-brand-orange-100 text-brand-orange-600' :
                        'bg-brand-green-100 text-brand-green-600'
                      }`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{grant.title}</p>
                        <p className="text-sm text-gray-500">{deadline.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${daysUntil <= 7 ? 'text-brand-red-600' : daysUntil <= 30 ? 'text-brand-orange-600' : 'text-brand-green-600'}`}>
                          {daysUntil} days
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
