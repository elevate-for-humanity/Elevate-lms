'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import React, { useState } from 'react';
import Image from 'next/image';
import {
  Video,
  Image as ImageIcon,
  Music,
  Mic,
  Sparkles,
  Download,
  Play,
  Pause,
  Loader2,
  Wand2,
  FileVideo,
  Camera,
  Palette,
} from 'lucide-react';

type GenerationType = 'video' | 'image' | 'avatar' | 'voiceover' | 'music';

interface GeneratedAsset {
  id: string;
  type: GenerationType;
  url: string;
  prompt: string;
  createdAt: Date;
  thumbnail?: string;
}



export default function AIStudioPage() {
  const [activeTab, setActiveTab] = useState<GenerationType>('video');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [duration, setDuration] = useState(30);
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const generateAsset = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '';
      let body: any = { prompt };

      switch (activeTab) {
        case 'video':
          endpoint = '/api/ai-studio/generate-video';
          body = { ...body, duration, aspectRatio, style: selectedStyle };
          break;
        case 'image':
          endpoint = '/api/ai/generate-asset';
          body = { type: 'image', prompt, style: selectedStyle };
          break;
        case 'avatar':
          endpoint = '/api/ai-studio/generate-avatar';
          body = { ...body, duration };
          break;
        case 'voiceover':
          endpoint = '/api/text-to-speech';
          body = { text: prompt, voice: selectedStyle };
          break;
        case 'music':
          endpoint = '/api/ai-studio/generate-music';
          body = { ...body, duration, style: selectedStyle };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();

      const newAsset: GeneratedAsset = {
        id: Date.now().toString(),
        type: activeTab,
        url: data.url || data.videoUrl || data.audioUrl,
        prompt,
        createdAt: new Date(),
        thumbnail: data.thumbnail,
      };

      setGeneratedAssets([newAsset, ...generatedAssets]);
      setPrompt('');
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to generate asset'
      );
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'video' as const, label: 'AI Video', icon: Video },
    { id: 'image' as const, label: 'AI Image', icon: ImageIcon },
    { id: 'avatar' as const, label: 'AI Avatar', icon: Camera },
    { id: 'voiceover' as const, label: 'Voiceover', icon: Mic },
    { id: 'music' as const, label: 'AI Music', icon: Music },
  ];

  const videoStyles = [
    'professional',
    'cinematic',
    'animated',
    'documentary',
    'social-media',
    'educational',
  ];

  const imageStyles = [
    'professional',
    'artistic',
    'photorealistic',
    'illustration',
    'abstract',
    'minimalist',
  ];

  const voiceStyles = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  const musicStyles = [
    'upbeat',
    'calm',
    'energetic',
    'ambient',
    'corporate',
    'cinematic',
  ];

  const getStyleOptions = () => {
    switch (activeTab) {
      case 'video':
      case 'avatar':
        return videoStyles;
      case 'image':
        return imageStyles;
      case 'voiceover':
        return voiceStyles;
      case 'music':
        return musicStyles;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Ai Studio" }]} />
      </div>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-600">
              AI Studio
            </h1>
          </div>
          <p className="text-black text-lg">
            Create professional videos, images, avatars, voiceovers, and music
            with AI
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-black hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-blue-600" />
                Generate {tabs.find((t) => t.id === activeTab)?.label}
              </h2>

              {/* Prompt Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  {activeTab === 'voiceover'
                    ? 'Text to Speak'
                    : 'Describe what you want to create'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTab === 'video'
                      ? 'e.g., A professional training video about workplace safety with modern graphics'
                      : activeTab === 'image'
                        ? 'e.g., Professional office environment with diverse team collaborating'
                        : activeTab === 'avatar'
                          ? 'e.g., Professional instructor explaining course concepts'
                          : activeTab === 'voiceover'
                            ? 'Enter the text you want to convert to speech...'
                            : 'e.g., Upbeat background music for training video'
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Style Selection */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    {activeTab === 'voiceover' ? 'Voice' : 'Style'}
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {getStyleOptions().map((style) => (
                      <option key={style} value={style}>
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration (for video/avatar/music) */}
                {(activeTab === 'video' ||
                  activeTab === 'avatar' ||
                  activeTab === 'music') && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      min="5"
                      max="300"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Aspect Ratio (for video) */}
                {activeTab === 'video' && (
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Aspect Ratio
                    </label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="4:5">4:5 (Instagram)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={generateAsset}
                disabled={loading || !prompt.trim()}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate {tabs.find((t) => t.id === activeTab)?.label}
                  </>
                )}
              </button>

              {/* Feature Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  <Sparkles className="w-5 h-5 inline-block" /> What you can
                  create:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  {activeTab === 'video' && (
                    <>
                      <li>• Professional training videos</li>
                      <li>• Marketing content</li>
                      <li>• Educational explainers</li>
                      <li>• Social media clips</li>
                    </>
                  )}
                  {activeTab === 'image' && (
                    <>
                      <li>• Course thumbnails</li>
                      <li>• Marketing graphics</li>
                      <li>• Social media posts</li>
                      <li>• Presentation slides</li>
                    </>
                  )}
                  {activeTab === 'avatar' && (
                    <>
                      <li>• AI instructor videos</li>
                      <li>• Talking head presentations</li>
                      <li>• Course introductions</li>
                      <li>• Personalized messages</li>
                    </>
                  )}
                  {activeTab === 'voiceover' && (
                    <>
                      <li>• Course narration</li>
                      <li>• Video voiceovers</li>
                      <li>• Audio lessons</li>
                      <li>• Multiple voice options</li>
                    </>
                  )}
                  {activeTab === 'music' && (
                    <>
                      <li>• Background music</li>
                      <li>• Intro/outro tracks</li>
                      <li>• Ambient soundscapes</li>
                      <li>• Custom compositions</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Generated Assets Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-black mb-4">
                Recent Creations
              </h3>

              {generatedAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-black">
                    Your generated assets will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {generatedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-blue-600 uppercase">
                          {asset.type}
                        </span>
                        <button className="text-black hover:text-blue-600" aria-label="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      {asset.type === 'image' && (
                        <div className="relative w-full h-32 mb-2">
                          <Image
                            src={asset.url}
                            alt={asset.prompt}
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 100vw, 300px"
                          />
                        </div>
                      )}

                      {(asset.type === 'video' || asset.type === 'avatar') && (
                        <div className="relative w-full h-32 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                          <Play className="w-8 h-8 text-black" />
                        </div>
                      )}

                      {(asset.type === 'voiceover' ||
                        asset.type === 'music') && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-2">
                          <button className="text-blue-600 hover:text-blue-700" aria-label="Action button">
                            <Play className="w-5 h-5" />
                          </button>
                          <div className="flex-1 h-1 bg-gray-200 rounded-full">
                            <div className="h-full w-0 bg-blue-600 rounded-full" />
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-black line-clamp-2">
                        {asset.prompt}
                      </p>
                      <p className="text-xs text-black mt-1">
                        {asset.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
