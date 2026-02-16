'use client';

import React from 'react';

import { useState } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';

interface VideoUploaderProps {
  onUploadComplete?: (url: string) => void;
  acceptedFormats?: string;
}

export default function VideoUploader({
  onUploadComplete,
  acceptedFormats = 'video/mp4,video/webm,video/mov,video/avi',
}: VideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError('File too large. Maximum size is 500MB.');
      return;
    }

    setUploading(true);
    setEnhancing(false);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      setProgress(25);
      setEnhancing(true);

      const response = await fetch('/api/media/enhance-video', {
        method: 'POST',
        body: formData,
      });

      setProgress(75);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      setResult(data);

      if (onUploadComplete && data.enhancedUrl) {
        onUploadComplete(data.enhancedUrl);
      }
    } catch (err: any) {
      // Error: $1
      setError('Failed to upload video');
    } finally {
      setUploading(false);
      setEnhancing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-black mb-4">
          Video Upload & Enhancement
        </h3>

        <div className="space-y-4">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-blue-500 transition-colors">
            <input
              type="file"
              accept={acceptedFormats}
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              {uploading ? (
                <Loader2 className="h-12 w-12 text-brand-blue-600 animate-spin" />
              ) : (
                <Upload className="h-12 w-12 text-slate-400" />
              )}
              <div>
                <p className="text-lg font-semibold text-black">
                  {uploading ? 'Processing...' : 'Click to upload video'}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  MP4, WebM, MOV, or AVI (max 500MB)
                </p>
              </div>
            </label>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-black">
                  {enhancing ? 'Enhancing video quality...' : 'Uploading...'}
                </span>
                <span className="text-brand-blue-600 font-semibold">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-brand-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                ✨ AI-powered enhancement: Upscaling, denoising, color
                correction, and stabilization
              </p>
            </div>
          )}

          {/* Success */}
          {result && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-1">
                    Video Enhanced Successfully!
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    {result.message}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Original:</span>
                      <a
                        href={result.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-600 hover:underline"
                      >
                        View Original
                      </a>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700 font-semibold">
                        Enhanced:
                      </span>
                      <a
                        href={result.enhancedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-blue-600 hover:underline font-semibold"
                      >
                        View Enhanced
                      </a>
                    </div>
                  </div>
                  {result.warning && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ {result.warning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-10 w-10 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">
                    Upload Failed
                  </h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhancement Info */}
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-brand-blue-900 mb-2">
              ✨ AI Enhancement Features:
            </h4>
            <ul className="text-sm text-brand-blue-700 space-y-1">
              <li>• Upscale to 1080p HD quality</li>
              <li>• Remove noise and grain</li>
              <li>• Enhance colors and contrast</li>
              <li>• Stabilize shaky footage</li>
              <li>• Optimize for web streaming</li>
              <li>• Compress for fast loading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
