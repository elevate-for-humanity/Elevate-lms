'use client';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import { Video, Play, Loader2, XCircle, RefreshCw } from 'lucide-react';

interface GenerationStatus {
  total: number;
  withVideos: number;
  withoutVideos: number;
  percentComplete: number;
}

interface GenerationResult {
  lessonId: string;
  success: boolean;
  videoUrl?: string;
  error?: string;
}



export default function VideoGeneratorPage() {
  const [status, setStatus] = useState<GenerationStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [batchSize, setBatchSize] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/admin/generate-lesson-videos');
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to fetch status');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const generateVideos = async () => {
    setGenerating(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/admin/generate-lesson-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setResults(data.results || []);
      fetchStatus(); // Refresh status
    } catch (err) {
      setError('An error occurred');
    } finally {
      setGenerating(false);
    }
  };

  const generateAll = async () => {
    setGenerating(true);
    setError(null);

    // Generate in batches until done
    let totalGenerated = 0;
    let hasMore = true;

    while (hasMore && totalGenerated < 100) { // Safety limit
      try {
        const res = await fetch('/api/admin/generate-lesson-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batchSize: 10 }),
        });

        const data = await res.json();
        totalGenerated += data.generated || 0;

        if (data.generated === 0) {
          hasMore = false;
        }

        fetchStatus();
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        setError('Batch generation failed');
        hasMore = false;
      }
    }

    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Video Generator" }]} />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Video className="w-8 h-8 text-brand-blue-600" />
            <h1 className="text-2xl font-bold">Lesson Video Generator</h1>
          </div>

          {/* Status */}
          {status && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{status.total}</div>
                <div className="text-sm text-gray-500">Total Lessons</div>
              </div>
              <div className="bg-brand-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-green-600">{status.withVideos}</div>
                <div className="text-sm text-gray-500">With Videos</div>
              </div>
              <div className="bg-brand-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-orange-600">{status.withoutVideos}</div>
                <div className="text-sm text-gray-500">Need Videos</div>
              </div>
              <div className="bg-brand-blue-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-blue-600">{status.percentComplete}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {status && (
            <div className="mb-6">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-blue-500 transition-all duration-500"
                  style={{ width: `${status.percentComplete}%` }}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Batch Size:</label>
              <select 
                value={batchSize} 
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="border rounded-lg px-3 py-2"
                disabled={generating}
              >
                <option value={1}>1</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <button
              onClick={generateVideos}
              disabled={generating || (status?.withoutVideos === 0)}
              className="flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Generate Batch
            </button>

            <button
              onClick={generateAll}
              disabled={generating || (status?.withoutVideos === 0)}
              className="flex items-center gap-2 bg-brand-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Generate All
            </button>

            <button
              onClick={fetchStatus}
              disabled={generating}
              className="flex items-center gap-2 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 font-medium border-b">
                Generation Results
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {results.map((result, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    {result.success ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <XCircle className="w-5 h-5 text-brand-red-500" />
                    )}
                    <span className="font-mono text-sm text-gray-600">
                      {result.lessonId.substring(0, 8)}...
                    </span>
                    {result.success ? (
                      <a 
                        href={result.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-blue-600 hover:underline text-sm"
                      >
                        View Video
                      </a>
                    ) : (
                      <span className="text-brand-red-600 text-sm">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Each lesson has content, topics, and duration defined in the database</li>
            <li>The generator creates a script from the lesson content</li>
            <li>AI generates a video with an instructor avatar speaking the script</li>
            <li>Videos are uploaded to Cloudflare Stream for fast delivery</li>
            <li>The lesson record is updated with the video URL</li>
          </ol>
          
          <div className="mt-4 p-4 bg-brand-blue-50 rounded-lg">
            <p className="text-sm text-brand-blue-800">
              <strong>Note:</strong> Video generation takes 30-60 seconds per lesson. 
              For 540 lessons, full generation will take several hours. 
              You can generate in batches and the system will track progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
