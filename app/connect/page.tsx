'use client';


import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import { 

export const dynamic = 'force-dynamic';
  Globe, ArrowRight, Loader2, Code, 
  Plug, Copy, Check, ExternalLink, Zap, Shield,
  BookOpen, CreditCard, Users, BarChart3
} from 'lucide-react';

type Step = 'platform' | 'url' | 'features' | 'generating' | 'setup';

interface Integration {
  siteId: string;
  apiKey: string;
  platform: string;
  embedScript: string;
  setupSteps: string[];
  platformSpecific: any;
  components: Array<{ name: string; embedCode: string; description: string }>;
  apiEndpoints: Array<{ method: string; endpoint: string; description: string; example: string }>;
  dashboardUrl: string;
}

const PLATFORMS = [
  { id: 'wordpress', name: 'WordPress', icon: '🔵', popular: true },
  { id: 'wix', name: 'Wix', icon: '🟣', popular: true },
  { id: 'squarespace', name: 'Squarespace', icon: '⬛', popular: true },
  { id: 'shopify', name: 'Shopify', icon: '🟢', popular: true },
  { id: 'webflow', name: 'Webflow', icon: '🔷', popular: false },
  { id: 'weebly', name: 'Weebly', icon: '🟠', popular: false },
  { id: 'godaddy', name: 'GoDaddy', icon: '🟡', popular: false },
  { id: 'custom', name: 'Custom / HTML', icon: '⚡', popular: false },
];

const FEATURES = [
  { id: 'courses', name: 'Course Catalog', icon: BookOpen, description: 'Display and sell courses' },
  { id: 'enrollment', name: 'Enrollment & Payments', icon: CreditCard, description: 'Accept payments, enroll students' },
  { id: 'dashboard', name: 'Student Dashboard', icon: Users, description: 'Progress tracking, certificates' },
  { id: 'login', name: 'Authentication', icon: Shield, description: 'Student login/signup' },
  { id: 'progress', name: 'Progress Tracking', icon: BarChart3, description: 'Track completion, analytics' },
];

export default function ConnectPage() {
  const [step, setStep] = useState<Step>('platform');
  const [platform, setPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['courses', 'enrollment', 'dashboard']);
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setStep('generating');

    try {
      const res = await fetch('/api/ai/build-remote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, platform, features: selectedFeatures }),
      });

      const data = await res.json();
      if (data.success) {
        setIntegration(data.integration);
        setStep('setup');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleFeature = (id: string) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-white">            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Connect" }]} />
      </div>
{/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Plug className="w-6 h-6 text-cyan-400" />
            <span className="font-bold text-lg">Connect Your Site</span>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href="/import" className="text-slate-400 hover:text-white">
              Import & Migrate →
            </Link>
            <Link href="/generate" className="text-slate-400 hover:text-white">
              Build New →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Step 1: Select Platform */}
        {step === 'platform' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-slate-900 mb-4">
                Keep Your Website, Add LMS Power
              </h1>
              <p className="text-slate-600 text-lg">
                Stay on your current platform. We'll give you code to add courses, 
                enrollments, and student management to your existing site.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-8">
              <h2 className="text-slate-900 font-bold mb-6">What platform is your site on?</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {PLATFORMS.filter(p => p.popular).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      platform === p.id
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <span className="text-3xl">{p.icon}</span>
                    <p className="text-slate-900 text-sm mt-2">{p.name}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PLATFORMS.filter(p => !p.popular).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      platform === p.id
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <p className="text-slate-600 text-sm mt-2">{p.name}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => platform && setStep('url')}
                disabled={!platform}
                className="w-full mt-8 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Enter URL */}
        {step === 'url' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-slate-900 mb-4">
                Enter Your Website URL
              </h1>
              <p className="text-slate-600">
                We'll analyze your site to provide the best integration.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Your {PLATFORMS.find(p => p.id === platform)?.name} Site URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.yoursite.com"
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('platform')}
                  className="px-6 py-4 border border-white/20 hover:bg-white/10 text-white font-medium rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={() => url && setStep('features')}
                  disabled={!url}
                  className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Features */}
        {step === 'features' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-slate-900 mb-4">
                What Do You Want to Add?
              </h1>
              <p className="text-slate-600">
                Select the features you want on your site.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 space-y-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                const selected = selectedFeatures.includes(feature.id);
                return (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                      selected
                        ? 'border-cyan-500 bg-cyan-500/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-cyan-500' : 'bg-white/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${selected ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900 font-bold">{feature.name}</p>
                      <p className="text-slate-500 text-sm">{feature.description}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected ? 'border-cyan-500 bg-cyan-500' : 'border-white/30'
                    }`}>
                      {selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setStep('url')}
                  className="px-6 py-4 border border-white/20 hover:bg-white/10 text-white font-medium rounded-lg"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={selectedFeatures.length === 0}
                  className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Generate Integration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Generating */}
        {step === 'generating' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              Generating Your Integration...
            </h2>
            <p className="text-slate-600">
              Creating custom code for {PLATFORMS.find(p => p.id === platform)?.name}
            </p>
          </div>
        )}

        {/* Step 5: Setup Instructions */}
        {step === 'setup' && integration && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-brand-green-400 rounded-full text-sm font-medium mb-4">
                <span className="text-slate-500 flex-shrink-0">•</span>
                Integration Ready!
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-4">
                Add This to Your {integration.platform} Site
              </h1>
            </div>

            {/* API Credentials */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Your API Credentials
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Site ID</label>
                  <div className="flex">
                    <code className="flex-1 px-4 py-2 bg-slate-700 rounded-l-lg text-cyan-400 font-mono text-sm">
                      {integration.siteId}
                    </code>
                    <button
                      onClick={() => copyToClipboard(integration.siteId, 'siteId')}
                      className="px-3 bg-white/10 rounded-r-lg hover:bg-white/20"
                    >
                      {copied === 'siteId' ? <Check className="w-4 h-4 text-brand-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">API Key</label>
                  <div className="flex">
                    <code className="flex-1 px-4 py-2 bg-slate-700 rounded-l-lg text-cyan-400 font-mono text-sm truncate">
                      {integration.apiKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(integration.apiKey, 'apiKey')}
                      className="px-3 bg-white/10 rounded-r-lg hover:bg-white/20"
                    >
                      {copied === 'apiKey' ? <Check className="w-4 h-4 text-brand-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Embed Script */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 font-bold flex items-center gap-2">
                  <Code className="w-5 h-5 text-cyan-400" />
                  Step 1: Add Embed Script
                </h3>
                <button
                  onClick={() => copyToClipboard(integration.embedScript, 'embed')}
                  className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/20"
                >
                  {copied === 'embed' ? <Check className="w-4 h-4 text-brand-green-400" /> : <Copy className="w-4 h-4" />}
                  Copy
                </button>
              </div>
              <pre className="bg-slate-700 rounded-lg p-4 overflow-x-auto">
                <code className="text-brand-green-400 text-sm font-mono whitespace-pre">
                  {integration.embedScript}
                </code>
              </pre>
              
              <div className="mt-4 p-4 bg-white/10 rounded-lg">
                <p className="text-brand-blue-300 text-sm font-medium mb-2">
                  {integration.platform} Instructions:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm">
                  {integration.setupSteps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Components */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Step 2: Add Components Where You Want Them
              </h3>
              <div className="space-y-4">
                {integration.components.map((comp, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-900 font-medium">{comp.name}</p>
                      <button
                        onClick={() => copyToClipboard(comp.embedCode, `comp-${idx}`)}
                        className="text-slate-400 hover:text-white"
                      >
                        {copied === `comp-${idx}` ? <Check className="w-4 h-4 text-brand-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-slate-500 text-sm mb-2">{comp.description}</p>
                    <code className="block bg-slate-700 rounded px-3 py-2 text-cyan-400 text-sm font-mono">
                      {comp.embedCode}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Specific */}
            {integration.platformSpecific.shortcodes && (
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                <h3 className="text-slate-900 font-bold mb-4">WordPress Shortcodes</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {integration.platformSpecific.shortcodes.map((sc: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded-lg">
                      <code className="text-cyan-400 font-mono text-sm">{sc.code}</code>
                      <p className="text-slate-500 text-xs mt-1">{sc.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-white/20 rounded-2xl p-6 border border-cyan-500/30">
              <h3 className="text-slate-900 font-bold mb-4">Next Steps</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href={integration.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <BarChart3 className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-slate-900 font-medium">Open Dashboard</p>
                    <p className="text-slate-500 text-sm">Manage courses & students</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
                </a>
                <Link
                  href="/store"
                  className="flex items-center gap-3 p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <CreditCard className="w-8 h-8 text-brand-green-400" />
                  <div>
                    <p className="text-slate-900 font-medium">Upgrade Plan</p>
                    <p className="text-slate-500 text-sm">Unlock all features</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
