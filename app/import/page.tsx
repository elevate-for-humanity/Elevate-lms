'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import { 
  Globe, ArrowRight, Loader2, Circle, 
  Palette, FileText, Image, Navigation, Sparkles,
  AlertCircle, ExternalLink
} from 'lucide-react';

type Step = 'url' | 'analyzing' | 'review' | 'customize' | 'preview';

interface ExtractedData {
  title: string;
  description: string;
  pageCount: number;
  imagesFound: number;
  colorsDetected: string[];
}

interface SiteConfig {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoText: string;
    tagline: string;
  };
  homepage: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaText: string;
    features: Array<{ title: string; description: string }>;
  };
  programs: Array<{ name: string; description: string; duration: string; level: string }>;
  navigation: Array<{ label: string; href: string }>;
  template: string;
  meta: { previewId: string; importedFrom: string };
}

export default function ImportSitePage() {
  const [step, setStep] = useState<Step>('url');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleImport = async () => {
    if (!url) return;
    
    setError('');
    setAnalyzing(true);
    setStep('analyzing');

    try {
      const res = await fetch('/api/ai/import-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setExtracted(data.extracted);
      setConfig(data.config);
      localStorage.setItem('sitePreviewConfig', JSON.stringify(data.config));
      setStep('review');
    } catch (err) {
      setError('An error occurred');
      setStep('url');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCustomize = (field: string, value: string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      branding: {
        ...config.branding,
        [field]: value,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Import" }]} />
      </div>
{/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Globe className="w-6 h-6 text-brand-green-400" />
            <span className="font-bold text-lg">Import Your Website</span>
          </div>
          <Link href="/generate" className="text-slate-400 hover:text-white text-sm">
            Or build from scratch →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Step 1: Enter URL */}
        {step === 'url' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-white mb-4">
                Import Your Existing Website
              </h1>
              <p className="text-slate-300 text-lg">
                We'll analyze your current site and recreate it on Elevate LMS - 
                keeping your branding, content, and style.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Your Website URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-white/10 rounded-lg overflow-hidden border border-white/20 focus-within:border-brand-green-500">
                    <span className="pl-4 text-slate-400">https://</span>
                    <input
                      type="text"
                      value={url.replace(/^https?:\/\//, '')}
                      onChange={(e) => setUrl(`https://${e.target.value.replace(/^https?:\/\//, '')}`)}
                      placeholder="www.yoursite.com"
                      className="flex-1 bg-transparent px-2 py-4 text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  Enter your current training website or organization site
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-brand-red-500/20 border border-brand-red-500/50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-brand-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-brand-red-200 font-medium">Import Failed</p>
                    <p className="text-brand-red-300 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={!url || url.length < 10}
                className="w-full py-4 bg-brand-green-600 hover:bg-brand-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Globe className="w-5 h-5" />
                Analyze & Import
              </button>

              <div className="pt-6 border-t border-white/10">
                <p className="text-slate-400 text-sm text-center mb-4">
                  Works with any website platform:
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-slate-500 text-sm">
                  <span>WordPress</span>
                  <span>•</span>
                  <span>Wix</span>
                  <span>•</span>
                  <span>Squarespace</span>
                  <span>•</span>
                  <span>Custom Sites</span>
                  <span>•</span>
                  <span>Any HTML</span>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-brand-green-400" />
                </div>
                <h3 className="text-white font-bold mb-1">1. Enter URL</h3>
                <p className="text-slate-400 text-sm">Paste your current website address</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-brand-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-1">2. AI Analyzes</h3>
                <p className="text-slate-400 text-sm">We extract your content, colors & style</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-brand-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Circle className="w-6 h-6 text-brand-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-1">3. Launch</h3>
                <p className="text-slate-400 text-sm">Your site recreated on Elevate LMS</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {step === 'analyzing' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green-500/20 rounded-full mb-6">
              <Loader2 className="w-10 h-10 text-brand-green-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">
              Analyzing Your Website...
            </h2>
            <p className="text-slate-300 mb-8">
              {url}
            </p>
            <div className="space-y-3 text-sm text-slate-400 max-w-xs mx-auto text-left">
              <p className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching pages...
              </p>
              <p className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting content...
              </p>
              <p className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Detecting colors & fonts...
              </p>
              <p className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI generating config...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Review Extracted Data */}
        {step === 'review' && extracted && config && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-500/20 text-brand-green-400 rounded-full text-sm font-medium mb-4">
                <Circle className="w-4 h-4" />
                Import Successful!
              </div>
              <h1 className="text-4xl font-black text-white mb-4">
                We Found Your Site
              </h1>
              <p className="text-slate-300">
                Review what we extracted and customize before launching.
              </p>
            </div>

            {/* Extracted Summary */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="w-5 h-5 text-brand-green-400" />
                <span className="text-white font-medium">{url}</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <FileText className="w-6 h-6 text-brand-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{extracted.pageCount}</p>
                  <p className="text-slate-400 text-sm">Pages</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Image className="w-6 h-6 text-brand-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{extracted.imagesFound}</p>
                  <p className="text-slate-400 text-sm">Images</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Palette className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{extracted.colorsDetected.length}</p>
                  <p className="text-slate-400 text-sm">Colors</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <Navigation className="w-6 h-6 text-brand-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{config.navigation.length}</p>
                  <p className="text-slate-400 text-sm">Nav Items</p>
                </div>
              </div>

              {/* Detected Colors */}
              <div className="mt-6">
                <p className="text-slate-400 text-sm mb-2">Detected Colors:</p>
                <div className="flex gap-2 flex-wrap">
                  {extracted.colorsDetected.slice(0, 8).map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-lg border border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Customize Branding */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-400" />
                Customize Branding
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Site Name</label>
                  <input
                    type="text"
                    value={config.branding.logoText}
                    onChange={(e) => handleCustomize('logoText', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Tagline</label>
                  <input
                    type="text"
                    value={config.branding.tagline}
                    onChange={(e) => handleCustomize('tagline', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.branding.primaryColor}
                      onChange={(e) => handleCustomize('primaryColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.branding.primaryColor}
                      onChange={(e) => handleCustomize('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Secondary</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.branding.secondaryColor}
                      onChange={(e) => handleCustomize('secondaryColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.branding.secondaryColor}
                      onChange={(e) => handleCustomize('secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Accent</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.branding.accentColor}
                      onChange={(e) => handleCustomize('accentColor', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.branding.accentColor}
                      onChange={(e) => handleCustomize('accentColor', e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Programs Found */}
            {config.programs.length > 0 && (
              <div className="bg-white/5 backdrop-blur rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4">Programs/Services Found</h3>
                <div className="space-y-2">
                  {config.programs.map((program, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <Circle className="w-5 h-5 text-brand-green-400" />
                      <div>
                        <p className="text-white font-medium">{program.name}</p>
                        <p className="text-slate-400 text-sm">{program.description.slice(0, 80)}...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('url')}
                className="px-6 py-4 border border-white/20 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('sitePreviewConfig', JSON.stringify(config));
                  window.location.href = `/preview/${config.meta.previewId}`;
                }}
                className="flex-1 py-4 bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Preview My Site
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
