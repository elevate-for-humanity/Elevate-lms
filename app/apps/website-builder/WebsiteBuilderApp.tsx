'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Layout, Settings, Plus, Globe, Eye, Trash2, Edit,
  Monitor, Smartphone, ChevronRight, X
} from 'lucide-react';

interface Props {
  user: any;
  subscription: any;
  websites: any[];
  trialDaysRemaining: number;
}

const TEMPLATES = [
  { id: 'training-provider', name: 'Training Provider', description: 'Perfect for workforce training' },
  { id: 'trade-school', name: 'Trade School', description: 'For vocational schools' },
  { id: 'nonprofit', name: 'Nonprofit', description: 'For community organizations' },
  { id: 'apprenticeship', name: 'Apprenticeship', description: 'Showcase apprenticeship programs' },
];

export function WebsiteBuilderApp({ user, subscription, websites: initialWebsites, trialDaysRemaining }: Props) {
  const [websites, setWebsites] = useState(initialWebsites);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const createWebsite = async (name: string, templateId: string) => {
    if (!supabase) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('user_websites')
      .insert({
        user_id: user.id,
        site_name: name,
        template_id: templateId,
        is_published: false,
      })
      .select()
      .single();

    if (!error && data) {
      // Create default pages
      await supabase.from('website_pages').insert([
        { website_id: data.id, name: 'Home', slug: 'home', is_home: true, blocks: [] },
        { website_id: data.id, name: 'About', slug: 'about', blocks: [] },
        { website_id: data.id, name: 'Contact', slug: 'contact', blocks: [] },
      ]);
      
      setWebsites(prev => [data, ...prev]);
      setShowNewModal(false);
    }
    setLoading(false);
  };

  const deleteWebsite = async (id: string) => {
    if (!supabase || !confirm('Delete this website?')) return;
    await supabase.from('user_websites').delete().eq('id', id);
    setWebsites(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Trial Banner */}
      {subscription.status === 'trial' && trialDaysRemaining > 0 && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          Trial: {trialDaysRemaining} days remaining. 
          <Link href="/store/apps/website-builder?upgrade=true" className="underline ml-2">Upgrade now</Link>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Layout className="w-6 h-6 text-brand-blue-900" />
            </div>
            <div>
              <h1 className="font-bold">Website Builder</h1>
              <p className="text-brand-blue-200 text-sm">Build Professional Websites</p>
            </div>
          </div>
          <Link href="/apps/website-builder/settings" className="p-2 hover:bg-brand-blue-800 rounded-lg">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">My Websites</h2>
            <p className="text-gray-600">{websites.length} website{websites.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Website
          </button>
        </div>

        {/* Website Grid */}
        {websites.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-bold mb-2">No websites yet</h3>
            <p className="text-gray-500 mb-4">Create your first website to get started</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg"
            >
              Create Website
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map(website => (
              <div key={website.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                {/* Preview */}
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-100 flex items-center justify-center relative">
                  <Layout className="w-12 h-12 text-brand-blue-300" />
                  {website.is_published && (
                    <span className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      Live
                    </span>
                  )}
                </div>
                
                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold mb-1">{website.site_name}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {website.subdomain ? `${website.subdomain}.elevatesite.com` : 'Not published'}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/apps/website-builder/edit/${website.id}`}
                      className="flex-1 px-3 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium text-center"
                    >
                      <Edit className="w-4 h-4 inline mr-1" /> Edit
                    </Link>
                    {website.is_published && (
                      <a
                        href={`https://${website.subdomain}.elevatesite.com`}
                        target="_blank"
                        className="px-3 py-2 border rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteWebsite(website.id)}
                      className="px-3 py-2 border rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Website Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Create New Website</h3>
              <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const name = (e.target as any).siteName.value;
              createWebsite(name, selectedTemplate);
            }}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Website Name</label>
                <input
                  name="siteName"
                  required
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="My Training Center"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Choose Template</label>
                <div className="grid grid-cols-2 gap-4">
                  {TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        selectedTemplate === template.id ? 'border-brand-blue-600 bg-brand-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="w-full aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                        <Layout className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="font-bold">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewModal(false)} className="flex-1 px-4 py-3 border rounded-lg">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedTemplate}
                  className="flex-1 px-4 py-3 bg-brand-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
