"use client";

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {

  ArrowLeft,
  Save,
  Play,
  Facebook,
  Linkedin,
  Instagram,
  Sparkles,
  Share2,
} from 'lucide-react';

export default function NewSocialCampaignPage() {
  const router = useRouter();

  

  const [campaign, setCampaign] = useState({
    name: '',
    contentSource: 'blog' as 'blog' | 'ai' | 'manual',
    platforms: [] as string[],
    frequency: '3x-daily' as '3x-daily' | 'daily' | 'weekly',
    times: ['09:00', '13:00', '17:00'],
    program: 'all',
    duration: '30',
  });

  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const togglePlatform = (platform: string) => {
    setCampaign({
      ...campaign,
      platforms: campaign.platforms.includes(platform)
        ? campaign.platforms.filter((p) => p !== platform)
        : [...campaign.platforms, platform],
    });
  };

  const generatePosts = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/social-media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: campaign.program,
          count:
            parseInt(campaign.duration) *
            (campaign.frequency === '3x-daily' ? 3 : 1),
          contentSource: campaign.contentSource,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setGeneratedPosts(result.posts);
      }
    } catch (error) { /* Error handled silently */ 
    // Error handled
  } finally {
      setGenerating(false);
    }
  };

  const saveCampaign = async () => {
    const response = await fetch('/api/social-media/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...campaign, status: 'draft' }),
    });
    if (response.ok) {
      alert('Campaign saved as draft!');
      router.push('/admin/social-media');
    }
  };

  const activateCampaign = async () => {
    if (
      !confirm(
        'Activate this campaign? Posts will start going out immediately.'
      )
    )
      return;

    const response = await fetch('/api/social-media/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...campaign, status: 'active' }),
    });
    if (response.ok) {
      alert('Campaign activated! Posts will go out 3x daily.');
      router.push('/admin/social-media');
    }
  };

  return (
    <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
{/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-social-campaigns-new-hero.jpg"
          alt="New"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/social-media')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-black">
                  Create Social Media Campaign
                </h1>
                <p className="text-sm text-black">
                  Au to social media 3x daily
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={saveCampaign}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={activateCampaign}
                disabled={generatedPosts.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>Activate Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaign.name}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => setCampaign({ ...campaign, name: e.target.value })}
                    placeholder="e.g., Barber Program Promotion"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Content Source
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() =>
                        setCampaign({ ...campaign, contentSource: 'blog' })
                      }
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        campaign.contentSource === 'blog'
                          ? 'border-brand-blue-600 bg-brand-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-black">
                        Blog Posts
                      </div>
                      <div className="text-sm text-black mt-1">
                        From your blog
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setCampaign({ ...campaign, contentSource: 'ai' })
                      }
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        campaign.contentSource === 'ai'
                          ? 'border-brand-blue-600 bg-brand-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-black flex items-center">
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI Generated
                      </div>
                      <div className="text-sm text-black mt-1">
                        GPT-4 powered
                      </div>
                    </button>
                    <button
                      onClick={() =>
                        setCampaign({ ...campaign, contentSource: 'manual' })
                      }
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        campaign.contentSource === 'manual'
                          ? 'border-brand-blue-600 bg-brand-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-black">Manual</div>
                      <div className="text-sm text-black mt-1">
                        Write your own
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Program Focus
                  </label>
                  <select
                    value={campaign.program}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => setCampaign({ ...campaign, program: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Programs</option>
                    <option value="barber">Barber Program</option>
                    <option value="cna">CNA Program</option>
                    <option value="cdl">CDL Program</option>
                    <option value="hvac">HVAC Program</option>
                    <option value="welding">Welding Program</option>
                    <option value="phlebotomy">Phlebotomy</option>
                    <option value="dental-assistant">Dental Assistant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Platform Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Select Platforms</h2>

              <div className="grid grid-cols-2 gap-4">
                <PlatformButton
                  name="Facebook"
                  icon={Facebook}
                  selected={campaign.platforms.includes('facebook')}
                  onClick={() => togglePlatform('facebook')}
                />
                <PlatformButton
                  name="Twitter"
                  icon={Share2}
                  selected={campaign.platforms.includes('twitter')}
                  onClick={() => togglePlatform('twitter')}
                />
                <PlatformButton
                  name="LinkedIn"
                  icon={Linkedin}
                  selected={campaign.platforms.includes('linkedin')}
                  onClick={() => togglePlatform('linkedin')}
                />
                <PlatformButton
                  name="Instagram"
                  icon={Instagram}
                  selected={campaign.platforms.includes('instagram')}
                  onClick={() => togglePlatform('instagram')}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Posting Schedule</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Frequency
                  </label>
                  <select
                    value={campaign.frequency}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setCampaign({
                        ...campaign,
                        frequency: e.target.value as
                          | '3x-daily'
                          | 'daily'
                          | 'weekly',
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  >
                    <option value="3x-daily">
                      3x Daily (9 AM, 1 PM, 5 PM EST)
                    </option>
                    <option value="daily">Once Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                {campaign.frequency === '3x-daily' && (
                  <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-brand-blue-900 mb-2">
                      Daily Posting Times (EST)
                    </h3>
                    <ul className="space-y-1 text-sm text-brand-blue-800">
                      <li>• Morning: 9:00 AM</li>
                      <li>• Afternoon: 1:00 PM</li>
                      <li>• Evening: 5:00 PM</li>
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Campaign Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={campaign.duration}
                    onChange={(
                      e: React.ChangeEvent<
                        | HTMLInputElement
                        | HTMLSelectElement
                        | HTMLTextAreaElement
                      >
                    ) => setCampaign({ ...campaign, duration: e.target.value })}
                    min="1"
                    max="365"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-black mt-1">
                    Total posts:{' '}
                    {parseInt(campaign.duration) *
                      (campaign.frequency === '3x-daily' ? 3 : 1)}
                  </p>
                </div>
              </div>
            </div>

            {/* Generate Posts */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Generated Posts</h2>
                <button
                  onClick={generatePosts}
                  disabled={
                    generating ||
                    !campaign.name ||
                    campaign.platforms.length === 0
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{generating ? 'Generating...' : 'Generate Posts'}</span>
                </button>
              </div>

              {generatedPosts.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {generatedPosts.map((post, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-black">
                          Post {index + 1}
                        </span>
                        <span className="text-xs text-black">
                          Day {Math.floor(index / 3) + 1} -{' '}
                          {['Morning', 'Afternoon', 'Evening'][index % 3]}
                        </span>
                      </div>
                      <p className="text-sm text-black">{post}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-black">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-black" />
                  <p>Click "Generate Posts" to create content</p>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold text-black mb-4">
                Campaign Summary
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-black mb-1">
                    Campaign Name
                  </div>
                  <div className="text-sm font-medium text-black">
                    {campaign.name || 'Untitled Campaign'}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.length > 0 ? (
                      campaign.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="inline-flex items-center px-2 py-2 rounded-md text-xs font-medium bg-brand-blue-100 text-brand-blue-800"
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-black">
                        No platforms selected
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Frequency</div>
                  <div className="text-sm text-black">
                    {campaign.frequency === '3x-daily'
                      ? '3x Daily'
                      : campaign.frequency}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Duration</div>
                  <div className="text-sm text-black">
                    {campaign.duration} days
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">Total Posts</div>
                  <div className="text-sm font-medium text-black">
                    {parseInt(campaign.duration) *
                      (campaign.frequency === '3x-daily' ? 3 : 1)}{' '}
                    posts
                  </div>
                </div>

                <div>
                  <div className="text-xs text-black mb-1">
                    Content Source
                  </div>
                  <div className="text-sm text-black">
                    {campaign.contentSource === 'blog'
                      ? 'Blog Posts'
                      : campaign.contentSource === 'ai'
                        ? 'AI Generated'
                        : 'Manual'}
                  </div>
                </div>

                {generatedPosts.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-xs text-black mb-1">Status</div>
                    <div className="text-sm font-medium text-brand-green-600">
                      • {generatedPosts.length} posts ready
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Create Social Campaign
                          </h2>
              <p className="text-base md:text-lg mb-8 text-brand-blue-100">
              Plan and schedule posts across social media platforms.
                          </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/admin/social-media"
                  className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                >
                View Campaigns
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                >
                View Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

interface PlatformButtonProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onClick: () => void;
}

function PlatformButton({
  name,
  icon: Icon,
  selected,
  onClick,
}: PlatformButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 border-2 rounded-lg transition-colors ${
        selected
          ? 'border-brand-blue-600 bg-brand-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <Icon
        className={`w-8 h-8 mb-2 ${selected ? 'text-brand-blue-600' : 'text-black'}`}
      />
      <div className="font-medium text-black">{name}</div>
    </button>
  );
}
