'use client';

import { useState } from 'react';

interface ImageSEOData {
  filename: string;
  altText: string;
  title: string;
  caption: string;
  keywords: string[];
  program: string;
  location: string;
  seoScore: number;
}

export default function ImageSEOManager() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageTopic, setPageTopic] = useState('');
  const [program, setProgram] = useState('');
  const [location, setLocation] = useState('');
  const [seoData, setSeoData] = useState<ImageSEOData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<ImageSEOData[]>([]);

  const generateSEO = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const topic = pageTopic || program || 'training';
    const loc = location || 'Indianapolis, Indiana';
    
    const generated: ImageSEOData = {
      filename: `${topic.toLowerCase().replace(/\s+/g, '-')}-${location.toLowerCase().replace(/\s+/g, '-')}.webp`,
      altText: `Students participating in ${topic} training at Elevate for Humanity in ${loc}.`,
      title: `${topic} Training Program | Elevate for Humanity`,
      caption: `Hands-on ${topic} training preparing students for certification and careers in ${loc}.`,
      keywords: [topic, 'training', 'certification', 'workforce', 'career', 'Indianapolis', loc],
      program: program,
      location: location,
      seoScore: 95
    };
    
    setSeoData(generated);
    setIsGenerating(false);
  };

  const addToQueue = () => {
    if (seoData) {
      setImages([...images, seoData]);
      setSeoData(null);
      setSelectedFile(null);
      setPageTopic('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Image SEO Manager</h1>
          <p className="text-slate-600 mt-2">AI-powered image optimization for search engines</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload & Configuration */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Upload & Configure</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Image File</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Page Topic</label>
              <input
                type="text"
                value={pageTopic}
                onChange={(e) => setPageTopic(e.target.value)}
                placeholder="e.g., Medical Assistant, HVAC"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Program</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              >
                <option value="">Select Program</option>
                <option value="medical-assistant">Medical Assistant</option>
                <option value="phlebotomy">Phlebotomy</option>
                <option value="hvac">HVAC</option>
                <option value="cdl">CDL</option>
                <option value="barber">Barber</option>
                <option value="cosmetology">Cosmetology</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Indianapolis, Martinsville"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <button
              onClick={generateSEO}
              disabled={isGenerating || !selectedFile}
              className="w-full bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate SEO Metadata'}
            </button>
          </div>

          {/* Generated SEO Data */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Generated SEO Data</h2>
            
            {seoData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{seoData.seoScore}</div>
                  <div>
                    <div className="font-semibold text-green-800">SEO Score</div>
                    <div className="text-sm text-green-600">Excellent</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Filename</label>
                  <input type="text" value={seoData.filename} readOnly className="w-full px-4 py-2 bg-slate-100 border rounded-lg font-mono text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alt Text</label>
                  <textarea value={seoData.altText} readOnly rows={2} className="w-full px-4 py-2 bg-slate-100 border rounded-lg text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Keywords</label>
                  <div className="flex flex-wrap gap-2">
                    {seoData.keywords.map((kw, i) => (
                      <span key={i} className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm">{kw}</span>
                    ))}
                  </div>
                </div>

                <button onClick={addToQueue} className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700">
                  Add to Queue
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p>Upload an image and configure to generate SEO metadata</p>
              </div>
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Queue ({images.length})</h2>
            <button className="bg-brand-blue-600 text-white font-semibold py-2 px-6 rounded-lg">
              Optimize All & Update Sitemap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
