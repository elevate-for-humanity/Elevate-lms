"use client";

import React from 'react';

import { useState } from 'react';
import { Upload, AlertCircle, Loader2, Music, Mic, FileVideo } from 'lucide-react';

export default function AdvancedVideoUploader() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [voiceoverFile, setVoiceoverFile] = useState<File | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [useTextToSpeech, setUseTextToSpeech] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [voiceoverVolume, setVoiceoverVolume] = useState(1.0);

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const defaultVoiceoverText = `Transform your career with professional barber training.
Join hundreds of students who have launched successful careers.
100% free training with job placement guarantee.
Apply today and start your journey.`;

  const handleProcess = async () => {
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (useTextToSpeech && !voiceoverText.trim()) {
      setError('Please enter voiceover text or upload an audio file');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      if (useTextToSpeech && voiceoverText.trim()) {
        formData.append('voiceoverText', voiceoverText);
      } else if (voiceoverFile) {
        formData.append('voiceover', voiceoverFile);
      }

      if (musicFile) {
        formData.append('music', musicFile);
      }

      formData.append('musicVolume', musicVolume.toString());
      formData.append('voiceoverVolume', voiceoverVolume.toString());

      setProgress(25);

      const response = await fetch('/api/media/enhance-video-full', {
        method: 'POST',
        body: formData,
      });

      setProgress(75);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      setProgress(100);
      setResult(data);

    } catch (err: any) {
      // Error: $1
      setError('Failed to process video');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-3xl font-bold text-black mb-2">
          🎬 Professional Video Enhancement
        </h2>
        <p className="text-black mb-6">
          Upload your video, add voiceover and music, get professional results
        </p>

        <div className="space-y-6">
          {/* Video Upload */}
          <div className="border-2 border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileVideo className="h-10 w-10 text-brand-blue-600" />
              <h3 className="text-lg font-bold text-black">1. Upload Video</h3>
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setVideoFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-blue-50 file:text-brand-blue-700 hover:file:bg-brand-blue-100"
            />
            {videoFile && (
              <p className="mt-2 text-sm text-green-600">
                ✓ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Voiceover Options */}
          <div className="border-2 border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mic className="h-10 w-10 text-purple-600" />
              <h3 className="text-lg font-bold text-black">2. Add Voiceover</h3>
            </div>

            <div className="space-y-4">
              {/* Toggle between text- and file upload */}
              <div className="flex gap-4">
                <button
                  onClick={() => setUseTextToSpeech(true)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    useTextToSpeech
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-black hover:bg-slate-200'
                  }`}
                >
                  AI Text-
                </button>
                <button
                  onClick={() => setUseTextToSpeech(false)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    !useTextToSpeech
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-black hover:bg-slate-200'
                  }`}
                >
                  Upload Audio File
                </button>
              </div>

              {useTextToSpeech ? (
                <div>
                  <label className="block text-sm font-semibold text-black mb-2">
                    Voiceover Script:
                  </label>
                  <textarea
                    value={voiceoverText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setVoiceoverText(e.target.value)}
                    Content={defaultVoiceoverText}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    onClick={() => setVoiceoverText(defaultVoiceoverText)}
                    className="mt-2 text-sm text-purple-600 hover:underline"
                  >
                    Use default script
                  </button>
                  <div className="mt-3 flex items-center gap-4">
                    <label className="text-sm font-semibold text-black">
                      Voiceover Volume:
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={voiceoverVolume}
                      onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setVoiceoverVolume(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-black w-12">
                      {(voiceoverVolume * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setVoiceoverFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                  {voiceoverFile && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {voiceoverFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Background Music */}
          <div className="border-2 border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Music className="h-10 w-10 text-green-600" />
              <h3 className="text-lg font-bold text-black">3. Add Background Music (Optional)</h3>
            </div>
            <input
              type="file"
              accept="audio/*"
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMusicFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {musicFile && (
              <>
                <p className="mt-2 text-sm text-green-600">
                  ✓ {musicFile.name}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <label className="text-sm font-semibold text-black">
                    Music Volume:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setMusicVolume(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-black w-12">
                    {(musicVolume * 100).toFixed(0)}%
                  </span>
                </div>
              </>
            )}
            <p className="mt-2 text-xs text-slate-500">
              💡 Tip: Keep music volume low (20-40%) so voiceover is clear
            </p>
          </div>

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={processing || !videoFile}
            className="w-full py-4 px-6    text-white text-lg font-bold rounded-lg hover: hover: disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin" />
                Processing... {progress}%
              </span>
            ) : (
              '🎬 Enhance Video with Audio'
            )}
          </button>

          {/* Progress */}
          {processing && (
            <div className="space-y-2">
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="   h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-black">
                Enhancing video quality, adding voiceover and music...
              </p>
            </div>
          )}

          {/* Success */}
          {result && !error && (
            <div className="   border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <span className="text-slate-400 flex-shrink-0">•</span>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-green-900 mb-2">
                    🎉 Video Enhanced Successfully!
                  </h4>
                  <p className="text-green-700 mb-4">
                    {result.message}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm font-semibold text-black mb-1">
                        Video Enhancement:
                      </p>
                      <p className="text-sm text-black">
                        {result.details?.videoEnhancement}
                      </p>
                    </div>

                    {result.hasVoiceover && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-semibold text-black mb-1">
                          Voiceover:
                        </p>
                        <p className="text-sm text-black">
                          {result.generatedVoiceover ? 'AI-generated voiceover added' : 'Custom voiceover added'}
                        </p>
                      </div>
                    )}

                    {result.hasMusic && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm font-semibold text-black mb-1">
                          Background Music:
                        </p>
                        <p className="text-sm text-black">
                          Added at {(result.details?.musicVolume * 100).toFixed(0)}% volume
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <a
                      href={result.enhancedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-3 px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      ▶️ View Enhanced Video
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}${result.enhancedUrl}`);
                        alert('URL copied to clipboard!');
                      }}
                      className="block w-full text-center py-3 px-6 bg-white text-green-700 font-bold rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors"
                    >
                      📋 Copy Video URL
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-10 w-10 text-brand-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 mb-1">Processing Failed</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-brand-blue-50 rounded-lg p-6 border-2 border-brand-blue-200">
          <h4 className="font-bold text-brand-blue-900 mb-3">🎥 Video Enhancement</h4>
          <ul className="text-sm text-brand-blue-700 space-y-1">
            <li>• Upscale to 1080p HD</li>
            <li>• Remove noise & grain</li>
            <li>• Enhance colors</li>
            <li>• Sharpen details</li>
            <li>• Web optimized</li>
          </ul>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
          <h4 className="font-bold text-purple-900 mb-3">🎤 AI Voiceover</h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Natural voice synthesis</li>
            <li>• Professional quality</li>
            <li>• Adjustable volume</li>
            <li>• Or upload your own</li>
            <li>• Perfect timing</li>
          </ul>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
          <h4 className="font-bold text-green-900 mb-3">🎵 Background Music</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Au to video length</li>
            <li>• Volume control</li>
            <li>• Mixed with voiceover</li>
            <li>• Fade in/out</li>
            <li>• Professional mix</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
