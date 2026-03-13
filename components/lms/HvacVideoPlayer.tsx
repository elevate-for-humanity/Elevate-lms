'use client'

import { useRef, useState } from 'react'

interface HvacVideoPlayerProps {
  videoUrl: string
  audioUrl: string | null
  posterUrl: string
  title: string
  captionUrl?: string | null
}

export default function HvacVideoPlayer({ videoUrl, audioUrl, posterUrl, title, captionUrl }: HvacVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl bg-black">
      {error ? (
        // Fallback: direct download link if video fails to play
        <div className="aspect-video flex flex-col items-center justify-center bg-slate-900 gap-4 p-6">
          <img src={posterUrl} alt={title} className="max-h-48 object-contain opacity-80" />
          <p className="text-slate-400 text-sm text-center">Video player unavailable in this environment.</p>
          <a
            href={videoUrl}
            download
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium"
          >
            Download lesson video
          </a>
          {audioUrl && (
            <audio controls className="w-full max-w-md mt-2">
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          controls
          preload="metadata"
          playsInline
          className="w-full aspect-video"
          poster={posterUrl}
          aria-label={title ? `Lesson video: ${title}` : 'Lesson video'}
          onLoadedMetadata={() => setLoaded(true)}
          onError={() => setError(true)}
        >
          <source src={videoUrl} type="video/mp4" />
          {captionUrl && (
            <track kind="captions" src={captionUrl} srcLang="en" label="English" default />
          )}
          Your browser does not support the video element.
        </video>
      )}
    </div>
  )
}
