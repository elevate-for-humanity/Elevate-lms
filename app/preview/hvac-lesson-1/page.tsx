'use client'

import dynamic from 'next/dynamic'

const LessonVideoWithSimulation = dynamic(
  () => import('@/components/lms/LessonVideoWithSimulation'),
  { ssr: false }
)

const VIDEO_URL =
  'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/hvac/hvac-01-01-v15-enhanced.mp4'

export default function HVACLesson1Preview() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to HVAC Technician Training
        </h1>
        <p className="text-slate-600 mb-6">
          Module 1 &middot; Lesson 1 &mdash; Watch the video, then interact with the 3D condenser simulation below.
        </p>

        <LessonVideoWithSimulation
          lessonKey="hvac-01-01"
          videoUrl={VIDEO_URL}
          minimumTimeSeconds={10}
          onSimulationComplete={() => {
            alert('Simulation complete — lesson would be marked done.')
          }}
        />
      </div>
    </div>
  )
}
