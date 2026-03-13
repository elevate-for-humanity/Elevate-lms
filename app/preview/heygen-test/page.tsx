'use client'

const VIDEO_URL =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac/heygen-test-scene1.mp4'

export default function HeyGenTestPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-white mb-2">HeyGen Avatar Test — Scene 1</h1>
      <p className="text-slate-400 mb-6 text-center max-w-xl">
        Single-scene test: Brandon avatar with David Boles voice, DALL-E HVAC condenser background.
      </p>
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
        <video
          controls
          autoPlay
          preload="metadata"
          className="aspect-video w-full"
          src={VIDEO_URL}
        />
      </div>
      <p className="text-slate-500 text-sm mt-4">
        If this looks good, the full 6-scene lesson video will be generated next.
      </p>
    </div>
  )
}
