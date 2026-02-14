"use client";

import React from 'react';
import { sanitizeHtml } from '@/lib/sanitize';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AssetType {
  id: string;
  name: string;
  dimensions: string;
  description: string;
  examples: string[];
}

const ASSET_TYPES: Record<string, AssetType> = {
  social_post: {
    id: 'social_post',
    name: 'Social Media Post',
    dimensions: '1080x1080',
    description: 'Square post for Instagram, Facebook, LinkedIn',
    examples: [
      'Announce new program launch with enrollment CTA',
      'Share student success story with testimonial',
      'Promote upcoming webinar or event',
    ],
  },
  story: {
    id: 'story',
    name: 'Instagram Story',
    dimensions: '1080x1920',
    description: 'Vertical story format',
    examples: [
      'Behind-the-scenes of our programs',
      'Quick tip or educational content',
      'Countdown to program start date',
    ],
  },
  flyer: {
    id: 'flyer',
    name: 'Event Flyer',
    dimensions: '8.5x11',
    description: 'Printable flyer for events and promotions',
    examples: [
      'Program information session flyer',
      'Open house event announcement',
      'Scholarship opportunity flyer',
    ],
  },
  banner: {
    id: 'banner',
    name: 'Website Banner',
    dimensions: '1200x400',
    description: 'Hero banner for website',
    examples: [
      'Homepage hero banner with enrollment CTA',
      'Program showcase banner',
      'Limited-time offer banner',
    ],
  },
  email_header: {
    id: 'email_header',
    name: 'Email Header',
    dimensions: '600x200',
    description: 'Header image for email campaigns',
    examples: [
      'Newsletter header with brand colors',
      'Welcome email header',
      'Event invitation header',
    ],
  },
};

export default function AssetGenerator() {
  const [assetType, setAssetType] = useState('social_post');
  const [content, setContent] = useState('');
  const [generatedAsset, setGeneratedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assetName, setAssetName] = useState('');

  async function generateAsset() {
    setLoading(true);
    setGeneratedAsset(null);

    try {
      const response = await fetch(
        'https://efh-ai-stylist.your-subdomain.workers.dev/generate-asset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType,
            content,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGeneratedAsset(data.asset);
        setAssetName(
          `${ASSET_TYPES[assetType].name} - ${new Date().toLocaleDateString()}`
        );
      } else {
        alert('Failed to generate asset: ' + data.error);
      }
    } catch (error) {
      // Error: $1
      alert('Failed to generate asset');
    } finally {
      setLoading(false);
    }
  }

  async function saveAsset() {
    if (!generatedAsset || !assetName) {
      alert('Please provide a name for the asset');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('generated_assets')
        .insert({
          name: assetName,
          asset_type: assetType,
          html: generatedAsset.html,
          dimensions: generatedAsset.dimensions,
          copy_text: generatedAsset.copyText,
          summary: generatedAsset.summary,
          created_by: user?.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Asset saved successfully!');
      setGeneratedAsset(null);
      setAssetName('');
      setContent('');
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      alert('Failed to save asset: ' + error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  }

  const currentAssetType = ASSET_TYPES[assetType];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-brand-orange-600 mb-2 text-2xl md:text-3xl lg:text-4xl">
          Brand Asset Generator
        </h1>
        <p className="text-brand-text-muted">
          Create social media posts, flyers, and marketing materials with AI
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-brand-text mb-4">
              Asset Configuration
            </h2>
            {/* Asset Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Asset Type
              </label>
              <div className="grid grid-cols-1 gap-3">
                {Object.values(ASSET_TYPES).map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAssetType(type.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      assetType === type.id
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-brand-border hover:border-brand-border-dark'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-brand-text">
                          {type.name}
                        </h3>
                        <p className="text-sm text-brand-text-muted">
                          {type.description}
                        </p>
                      </div>
                      <span className="text-xs text-brand-text-light bg-brand-surface-dark px-2 py-2 rounded">
                        {type.dimensions}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-brand-text mb-2">
                Content Description
              </label>
              <textarea
                className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
                rows={4}
                placeholder="Describe what the asset should communicate..."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setContent(e.target.value)}
              />
              {currentAssetType.examples.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-brand-text-light mb-1">
                    Examples:
                  </p>
                  {currentAssetType.examples.map((example, i) => (
                    <button
                      key={i}
                      className="text-xs text-brand-info hover:text-brand-info block mb-1"
                      onClick={() => setContent(example)}
                    >
                      • {example}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Generate Button */}
            <button
              onClick={generateAsset}
              disabled={loading || !content}
              className="w-full bg-brand-info hover:bg-brand-info-hover text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                'Generate Asset with AI'
              )}
            </button>
          </div>
          {/* Save Panel */}
          {generatedAsset && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-brand-text mb-4">
                Save Asset
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-brand-text mb-2">
                  Asset Name
                </label>
                <input
                  type="text"
                  className="w-full border border-brand-border-dark rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-focus focus:border-transparent"
                  placeholder="e.g., Program Launch Social Post"
                  value={assetName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setAssetName(e.target.value)}
                />
              </div>
              <button
                onClick={saveAsset}
                disabled={saving}
                className="w-full bg-brand-success hover:bg-brand-success-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save Asset'}
              </button>
            </div>
          )}
        </div>
        {/* Preview Panel */}
        <div className="space-y-6">
          {generatedAsset ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="   px-6 py-4">
                <h2 className="text-2xl font-semibold text-white">Preview</h2>
                <p className="text-red-100 text-sm">{generatedAsset.summary}</p>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className="px-3 py-2 bg-brand-surface text-brand-info rounded-full text-sm">
                    {generatedAsset.dimensions}
                  </span>
                </div>
                {/* Asset Preview */}
                <div
                  className="border-2 border-brand-border rounded-lg overflow-hidden bg-white"
                  style={{
                    aspectRatio: getAspectRatio(generatedAsset.dimensions),
                  }}
                >
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(generatedAsset.html) }}
                  />
                </div>
                {/* Copy Text */}
                {generatedAsset.copyText && (
                  <div className="mt-4 p-4 bg-brand-surface rounded-lg">
                    <h3 className="font-semibold text-brand-text mb-2">
                      Copy Text:
                    </h3>
                    <p className="text-brand-text text-sm">
                      {generatedAsset.copyText}
                    </p>
                  </div>
                )}
                {/* Download Options */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() =>
                      downloadAsHTML(generatedAsset.html, assetName)
                    }
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Download HTML
                  </button>
                  <button
                    onClick={() => alert('Screenshot feature Available Now!')}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Export as Image
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-brand-text mb-2">
                No Asset Generated Yet
              </h3>
              <p className="text-brand-text-light">
                Select an asset type and describe what you want to create
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getAspectRatio(dimensions: string): string {
  const [width, height] = dimensions.split('x').map(Number);
  return `${width} / ${height}`;
}

function downloadAsHTML(html: string, name: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
