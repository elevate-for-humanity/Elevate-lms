import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { 
  
  XCircle, 
  Settings, 
  RefreshCw, 
  Users, 
  Building2,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Shield,
  Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Salesforce Integration | Admin',
  description: 'Configure and manage Salesforce CRM integration',
};

// Check if Salesforce is configured
function isSalesforceConfigured(): boolean {
  return !!(
    (process.env.SALESFORCE_API_KEY && process.env.SALESFORCE_INSTANCE_URL) ||
    (process.env.SALESFORCE_CLIENT_ID && process.env.SALESFORCE_CLIENT_SECRET)
  );
}

export default function SalesforceIntegrationPage() {
  const isConfigured = isSalesforceConfigured();

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Salesforce" }]} />
      </div>
<div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/admin" className="hover:text-gray-700">Admin</Link>
            <span>/</span>
            <Link href="/admin/integrations" className="hover:text-gray-700">Integrations</Link>
            <span>/</span>
            <span className="text-gray-900">Salesforce</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="#00A1E0">
                  <path d="M10.006 5.415a3.724 3.724 0 0 1 2.942-1.415c1.397 0 2.61.778 3.243 1.923a4.143 4.143 0 0 1 1.558-.305c2.29 0 4.147 1.857 4.147 4.147 0 2.29-1.857 4.147-4.147 4.147-.233 0-.46-.02-.682-.057a3.46 3.46 0 0 1-3.063 1.857 3.46 3.46 0 0 1-2.032-.657 3.926 3.926 0 0 1-3.37 1.927c-1.862 0-3.443-1.293-3.856-3.03a3.598 3.598 0 0 1-.537.04c-1.988 0-3.6-1.612-3.6-3.6 0-1.574 1.01-2.912 2.418-3.398a4.153 4.153 0 0 1-.127-1.01c0-2.29 1.857-4.147 4.147-4.147 1.41 0 2.657.704 3.406 1.78z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Salesforce Integration</h1>
                <p className="text-gray-600">Sync students, leads, and opportunities with your CRM</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isConfigured ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isConfigured ? (
                <>
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <span className="font-medium">Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Not Configured</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-brand-blue-600" />
              <span className="font-medium text-gray-900">Contacts Synced</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{isConfigured ? '—' : '0'}</p>
            <p className="text-sm text-gray-500 mt-1">Last sync: Never</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-brand-blue-600" />
              <span className="font-medium text-gray-900">Accounts</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{isConfigured ? '—' : '0'}</p>
            <p className="text-sm text-gray-500 mt-1">Partner organizations</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-medium text-gray-900">Opportunities</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{isConfigured ? '—' : '0'}</p>
            <p className="text-sm text-gray-500 mt-1">Active deals</p>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Configuration</h2>
            <p className="text-gray-600 mt-1">Set up your Salesforce connection</p>
          </div>
          
          {!isConfigured ? (
            <div className="p-6">
              <div className="bg-brand-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-brand-blue-900 mb-2">Quick Setup Guide</h3>
                <p className="text-brand-blue-800 mb-4">No IT team required! Follow these steps to connect Salesforce:</p>
                <ol className="space-y-3 text-brand-blue-800">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    <span>Log into Salesforce and go to <strong>Setup → Apps → App Manager</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    <span>Click <strong>New Connected App</strong> and fill in the details</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    <span>Enable OAuth and select scopes: <code className="bg-brand-blue-100 px-1 rounded">api</code>, <code className="bg-brand-blue-100 px-1 rounded">refresh_token</code></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    <span>Copy the <strong>Consumer Key</strong> and <strong>Consumer Secret</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-brand-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    <span>Add them to your environment variables (see below)</span>
                  </li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4">Required Environment Variables</h3>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_CLIENT_ID</code>
                    <span className="text-gray-500">= your Consumer Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_CLIENT_SECRET</code>
                    <span className="text-gray-500">= your Consumer Secret</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_USERNAME</code>
                    <span className="text-gray-500">= your Salesforce email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_PASSWORD</code>
                    <span className="text-gray-500">= your Salesforce password</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_SECURITY_TOKEN</code>
                    <span className="text-gray-500">= from Salesforce settings</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Or use the simpler API Key method:
                </p>
                <div className="space-y-3 font-mono text-sm mt-3">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_API_KEY</code>
                    <span className="text-gray-500">= your access token</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-2 py-2 rounded">SALESFORCE_INSTANCE_URL</code>
                    <span className="text-gray-500">= https://yourorg.salesforce.com</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-lg p-4 mb-6">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <div>
                  <p className="font-medium">Salesforce is connected!</p>
                  <p className="text-sm text-green-600">Your LMS data will sync automatically.</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition">
                  <RefreshCw className="w-5 h-5" />
                  Sync Now
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Settings className="w-5 h-5" />
                  Configure Mapping
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sync Settings */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Automatic Sync Settings</h2>
            <p className="text-gray-600 mt-1">Configure what data syncs to Salesforce</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                { label: 'New student enrollments → Leads', description: 'Create a Lead when a student enrolls', enabled: true },
                { label: 'Completed enrollments → Contacts', description: 'Convert Lead to Contact on completion', enabled: true },
                { label: 'Partner signups → Accounts', description: 'Create Account for new partners', enabled: true },
                { label: 'License purchases → Opportunities', description: 'Track revenue in Salesforce', enabled: true },
                { label: 'Student progress updates', description: 'Sync hours and completion status', enabled: false },
              ].map((setting, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{setting.label}</p>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer transition ${
                    setting.enabled ? 'bg-brand-blue-600' : 'bg-gray-300'
                  }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${
                      setting.enabled ? 'right-1' : 'left-1'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Integration Features</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Real-time Sync</h3>
                  <p className="text-sm text-gray-600">Data syncs instantly when events occur in the LMS</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Secure Connection</h3>
                  <p className="text-sm text-gray-600">OAuth 2.0 authentication with encrypted data transfer</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Custom Field Mapping</h3>
                  <p className="text-sm text-gray-600">Map LMS fields to your custom Salesforce fields</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Bi-directional Sync</h3>
                  <p className="text-sm text-gray-600">Changes in Salesforce can trigger LMS updates</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Link */}
        <div className="mt-8 text-center">
          <a 
            href="https://help.salesforce.com/s/articleView?id=sf.connected_app_create.htm" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-700"
          >
            Salesforce Connected App Documentation
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
