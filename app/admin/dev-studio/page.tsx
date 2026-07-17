import { Metadata } from 'next';
import Link from 'next/link';
import { Monitor, Database, Zap, Code, GitBranch, Box, Terminal, Layers, CreditCard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dev Studio | Elevate for Humanity Admin',
  description: 'Developer tools and utilities for Elevate platform administration.',
};

export default function DevStudioPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Terminal className="w-8 h-8 text-brand-orange-500" />
          <div>
            <h1 className="text-3xl font-bold">Dev Studio</h1>
            <p className="text-slate-400">Platform development and debugging tools</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors">
            <Database className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Database Explorer</h3>
            <p className="text-slate-400 text-sm mb-4">Browse and query platform data</p>
            <Link href="/admin/dev-studio/database" className="text-blue-400 hover:underline text-sm">Open →</Link>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors">
            <Code className="w-10 h-10 text-green-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">API Console</h3>
            <p className="text-slate-400 text-sm mb-4">Test API endpoints and view logs</p>
            <Link href="/admin/dev-studio/api" className="text-green-400 hover:underline text-sm">Open →</Link>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors">
            <Zap className="w-10 h-10 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Performance Monitor</h3>
            <p className="text-slate-400 text-sm mb-4">View system metrics and performance</p>
            <Link href="/admin/dev-studio/performance" className="text-yellow-400 hover:underline text-sm">Open →</Link>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors">
            <Box className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Container Registry</h3>
            <p className="text-slate-400 text-sm mb-4">Manage deployment containers</p>
            <Link href="/admin/dev-studio/containers" className="text-purple-400 hover:underline text-sm">Open →</Link>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors">
            <GitBranch className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Deployments</h3>
            <p className="text-slate-400 text-sm mb-4">View and manage deployments</p>
            <Link href="/admin/dev-studio/deployments" className="text-orange-400 hover:underline text-sm">Open →</Link>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors">
            <Layers className="w-10 h-10 text-teal-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Services</h3>
            <p className="text-slate-400 text-sm mb-4">View running services status</p>
            <Link href="/admin/dev-studio/services" className="text-teal-400 hover:underline text-sm">Open →</Link>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-colors border-2 border-brand-red-500/50">
            <CreditCard className="w-10 h-10 text-brand-red-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Subscription Config</h3>
            <p className="text-slate-400 text-sm mb-4">Manage plans, features, and billing</p>
            <Link href="/admin/dev-studio/subscriptions" className="text-brand-red-400 hover:underline text-sm">Open →</Link>
          </div>
        </div>

        <div className="mt-12 bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <button className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors">
              <Terminal className="w-5 h-5 mb-2" />
              <div className="text-sm font-semibold">Clear Cache</div>
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors">
              <Monitor className="w-5 h-5 mb-2" />
              <div className="text-sm font-semibold">View Logs</div>
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors">
              <Zap className="w-5 h-5 mb-2" />
              <div className="text-sm font-semibold">Run Health Check</div>
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 rounded-lg p-4 text-left transition-colors">
              <Code className="w-5 h-5 mb-2" />
              <div className="text-sm font-semibold">Rebuild Index</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
