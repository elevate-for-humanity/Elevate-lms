"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface ProgramOrientationVideoProps {
  onComplete?: () => void;
  videoUrl?: string;
  title?: string;
  description?: string;
  programId?: string;
}

export default function ProgramOrientationVideo({
  onComplete,
  videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/orientation/orientation-final.mp4`,
  title = 'Program Orientation',
  description = 'Watch this orientation video to learn about our programs, what to expect, and how to succeed.',
  programId,
}: ProgramOrientationVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const supabase = createClient();

  // Check if user has already watched this orientation
  useEffect(() => {
    async function checkWatchStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('orientation_completions')
        .select('completed_at')
        .eq('user_id', user.id)
        .eq('video_url', videoUrl)
        .single();

      if (data) setHasWatched(true);
    }
    checkWatchStatus();
  }, [videoUrl, supabase]);

  const handleVideoEnd = async () => {
    setHasWatched(true);
    
    // Log completion to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('orientation_completions')
        .upsert({
          user_id: user.id,
          program_id: programId,
          video_url: videoUrl,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,video_url' });

      // Also log to video_views for analytics
      await supabase
        .from('video_views')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          video_type: 'orientation',
          completed: true,
          viewed_at: new Date().toISOString()
        });
    }

    if (onComplete) {
      onComplete();
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Trigger Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              {hasWatched ? (
                <span className="text-slate-500 flex-shrink-0">•</span>
              ) : (
                <Play className="w-8 h-8 text-brand-blue-600" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-black mb-2">{title}</h3>
            <p className="text-sm text-black mb-4">{description}</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-medium"
            >
              <Play className="w-4 h-4" />
              {hasWatched ? 'Watch Again' : 'Watch Orientation'}
            </button>
            {hasWatched && (
              <span className="ml-3 text-sm text-brand-green-600 font-medium">
                • Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-black">{title}</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative bg-black aspect-video">
              <video
                className="w-full h-full"
                controls
                autoPlay
                playsInline
                preload="metadata"
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <p className="text-sm text-black mb-3">
                {description}
              </p>
              {hasWatched && (
                <div className="flex items-center gap-2 text-brand-green-600">
                  <span className="text-slate-500 flex-shrink-0">•</span>
                  <span className="font-medium">
                    Orientation completed! You can close this window.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
