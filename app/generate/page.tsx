'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

type Step = 'info' | 'details' | 'generating' | 'preview';

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
  footer: { description: string; contactEmail: string };
  seo: { title: string; description: string; keywords: string[] };
  meta: { previewId: string; organizationName: string };
}

const ORG_TYPES = [
  { value: 'training_provider', label: 'Training Provider', icon: '🎓' },
  { value: 'workforce_board', label: 'Workforce Board', icon: '🏛️' },
  { value: 'nonprofit', label: 'Nonprofit', icon: '💚' },
  { value: 'employer', label: 'Employer', icon: '🏢' },
  { value: 'apprenticeship_sponsor', label: 'Apprenticeship Sponsor', icon: '🔧' },
  { value: 'educational_institution', label: 'Educational Institution', icon: '📚' },
];

const INDUSTRIES = [
  'Healthcare', 'Technology', 'Manufacturing', 'Construction', 
  'Finance', 'Hospitality', 'Transportation', 'Energy', 'Other'
];

export default function GenerateSitePage() {
  const [step, setStep] = useState<Step>('info');
  const [formData, setFormData] = useState({
    organizationName: '',
    organizationType: '',
    industry: '',
    targetAudience: '',
    trainingTypes: '',
    description: '',
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setStep('generating');
    setError('');

    try {
      const res = await fetch('/api/ai/generate-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setSiteConfig(data.config);
      // Store config in localStorage for preview
      localStorage.setItem('sitePreviewConfig', JSON.stringify(data.config));
      setStep('preview');
    } catch (err) {
      setError('An error occurred');
      setStep('details');
    }
  };

  return (
    <div className="min-h-screen bg-slate-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Generate" }]} />
      </div>
{/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-6 h-6 text-brand-blue-400" />
            <span className="font-bold text-lg">Elevate LMS Generator</span>
          </div>
          <div className="text-sm text-slate-400">
            {step === 'info' && 'Step 1 of 3'}
            {step === 'details' && 'Step 2 of 3'}
            {step === 'generating' && 'Generating...'}
            {step === 'preview' && 'Preview Ready'}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Step 1: Basic Info */}
        {step === 'info' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-white mb-4">
                Build Your Training Platform
              </h1>
              <p className="text-slate-300 text-lg">
                AI will generate a complete LMS customized for your organization in seconds.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  placeholder="e.g., Midwest Career Academy"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-3">
                  Organization Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ORG_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, organizationType: type.value })}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        formData.organizationType === type.value
                          ? 'border-brand-blue-500 bg-brand-blue-500/20'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="text-white text-sm mt-1">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('details')}
                disabled={!formData.organizationName || !formData.organizationType}
                className="w-full py-4 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-black text-white mb-4">
                Tell Us More
              </h1>
              <p className="text-slate-300 text-lg">
                Help AI create the perfect site for your needs.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Industry Focus
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  <option value="" className="bg-slate-800">Select industry...</option>
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind} className="bg-slate-800">{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="e.g., Career changers, high school graduates, veterans"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Types of Training Offered
                </label>
                <input
                  type="text"
                  value={formData.trainingTypes}
                  onChange={(e) => setFormData({ ...formData, trainingTypes: e.target.value })}
                  placeholder="e.g., HVAC certification, medical assistant, CDL training"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Brief Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about your organization's mission and goals..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('info')}
                  className="px-6 py-4 border border-white/20 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate My Site
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-blue-500/20 rounded-full mb-6">
              <Loader2 className="w-10 h-10 text-brand-blue-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">
              Creating Your Platform...
            </h2>
            <p className="text-slate-300">
              AI is generating your custom LMS configuration
            </p>
            <div className="mt-8 space-y-2 text-sm text-slate-400">
              <p>• Analyzing your organization type</p>
              <p>• Generating brand colors and styling</p>
              <p>• Creating homepage content</p>
              <p>• Building program templates</p>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && siteConfig && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Site Generated!
              </div>
              <h1 className="text-4xl font-black text-white mb-4">
                Your Platform is Ready
              </h1>
              <p className="text-slate-300 text-lg">
                Preview your site below. Upgrade to launch it live.
              </p>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              {/* Mini Preview Header */}
              <div 
                className="p-6"
                style={{ backgroundColor: siteConfig.branding.primaryColor }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xl">
                    {siteConfig.branding.logoText}
                  </span>
                  <div className="flex gap-4 text-white/80 text-sm">
                    {siteConfig.navigation.slice(0, 4).map((nav) => (
                      <span key={nav.label}>{nav.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mini Preview Hero */}
              <div className="p-8 bg-slate-50">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  {siteConfig.homepage.heroTitle}
                </h2>
                <p className="text-slate-600 mb-4">
                  {siteConfig.homepage.heroSubtitle}
                </p>
                <button 
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: siteConfig.branding.accentColor }}
                >
                  {siteConfig.homepage.heroCtaText}
                </button>
              </div>

              {/* Mini Preview Programs */}
              <div className="p-8 border-t">
                <h3 className="font-bold text-slate-900 mb-4">Featured Programs</h3>
                <div className="grid grid-cols-3 gap-4">
                  {siteConfig.programs.map((program) => (
                    <div key={program.name} className="p-4 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-900 text-sm">{program.name}</p>
                      <p className="text-xs text-slate-500">{program.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">
                Choose Your Plan to Launch
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <a
                  href={`/store/checkout?plan=starter_monthly&preview=${siteConfig.meta.previewId}`}
                  className="p-6 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-colors"
                >
                  <p className="text-white font-bold text-lg">Starter</p>
                  <p className="text-3xl font-black text-white my-2">$99<span className="text-lg">/mo</span></p>
                  <p className="text-slate-400 text-sm">100 students</p>
                </a>
                
                <a
                  href={`/store/checkout?plan=professional_monthly&preview=${siteConfig.meta.previewId}`}
                  className="p-6 bg-brand-blue-600 hover:bg-brand-blue-700 rounded-xl text-center transition-colors ring-2 ring-blue-400"
                >
                  <p className="text-white font-bold text-lg">Professional</p>
                  <p className="text-3xl font-black text-white my-2">$299<span className="text-lg">/mo</span></p>
                  <p className="text-brand-blue-200 text-sm">500 students</p>
                </a>
                
                <a
                  href={`/store/request-license?preview=${siteConfig.meta.previewId}`}
                  className="p-6 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-colors"
                >
                  <p className="text-white font-bold text-lg">Enterprise</p>
                  <p className="text-3xl font-black text-white my-2">Custom</p>
                  <p className="text-slate-400 text-sm">Unlimited</p>
                </a>
              </div>

              <p className="text-center text-slate-400 text-sm">
                All plans include 14-day free trial. Your generated site will be saved.
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setStep('info');
                  setSiteConfig(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ← Start Over
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
