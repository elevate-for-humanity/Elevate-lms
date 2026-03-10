'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import HVACSimulation from '@/components/lms/HVACSimulation'
import { hvacLessonSimulations } from '@/lib/lms/hvac-simulations'

type LessonVideoWithSimulationProps = {
  lessonKey: keyof typeof hvacLessonSimulations
  videoUrl: string
  minimumTimeSeconds?: number
  onMinimumTimeReached?: () => void
  onSimulationComplete?: () => void
}

export default function LessonVideoWithSimulation({
  lessonKey,
  videoUrl,
  minimumTimeSeconds = 120,
  onMinimumTimeReached,
  onSimulationComplete,
}: LessonVideoWithSimulationProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [watchedSeconds, setWatchedSeconds] = useState(0)
  const [simulationComplete, setSimulationComplete] = useState(false)
  const [minimumReported, setMinimumReported] = useState(false)
  const [teachingRead, setTeachingRead] = useState(false)

  const simulation = useMemo(
    () => hvacLessonSimulations[lessonKey],
    [lessonKey]
  )

  const teaching = simulation.teaching
  const minimumReached = watchedSeconds >= minimumTimeSeconds

  useEffect(() => {
    if (minimumReached && !minimumReported) {
      setMinimumReported(true)
      onMinimumTimeReached?.()
    }
  }, [minimumReached, minimumReported, onMinimumTimeReached])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let intervalId: ReturnType<typeof setInterval> | null = null

    const startTracking = () => {
      if (intervalId) return
      intervalId = setInterval(() => {
        if (!video.paused && !video.ended) {
          setWatchedSeconds((prev) => prev + 1)
        }
      }, 1000)
    }

    const stopTracking = () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    video.addEventListener('play', startTracking)
    video.addEventListener('pause', stopTracking)
    video.addEventListener('ended', stopTracking)

    return () => {
      stopTracking()
      video.removeEventListener('play', startTracking)
      video.removeEventListener('pause', stopTracking)
      video.removeEventListener('ended', stopTracking)
    }
  }, [])

  // All 3 steps must be done in order
  const simulationUnlocked = minimumReached && teachingRead

  return (
    <div className="space-y-6">
      {/* ── STEP 1: Video ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${minimumReached ? 'bg-green-100 text-green-700' : 'bg-brand-blue-100 text-brand-blue-700'}`}>1</span>
          <span className="font-semibold text-slate-800">Watch the lesson video</span>
        </div>
        <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
          <video
            ref={videoRef}
            controls
            preload="metadata"
            className="aspect-video w-full"
            src={videoUrl}
          />
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${minimumReached ? 'bg-green-500' : 'bg-brand-blue-500'}`}
              style={{ width: `${Math.min(100, (watchedSeconds / minimumTimeSeconds) * 100)}%` }}
            />
          </div>
          <span className={minimumReached ? 'text-green-600 font-medium' : 'text-slate-500'}>
            {minimumReached ? 'Complete' : `${watchedSeconds}s / ${minimumTimeSeconds}s`}
          </span>
        </div>
      </div>

      {/* ── STEP 2: Teaching content (unlocks after video) ── */}
      {minimumReached && teaching && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${teachingRead ? 'bg-green-100 text-green-700' : 'bg-brand-blue-100 text-brand-blue-700'}`}>2</span>
            <span className="font-semibold text-slate-800">Study the equipment components</span>
          </div>

          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b px-5 py-4">
              <p className="text-slate-700 leading-relaxed">{teaching.intro}</p>
            </div>

            <div className="divide-y">
              {teaching.components.map((comp, idx) => (
                <div key={comp.id} className="px-5 py-5">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-blue-50 text-brand-blue-700 flex items-center justify-center font-bold text-sm">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-slate-900">{comp.name}</h4>
                      <p className="text-sm text-slate-500 mt-0.5">Location: {comp.location}</p>

                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Function</div>
                          <p className="text-sm text-slate-700 leading-relaxed">{comp.function}</p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Why it matters</div>
                          <p className="text-sm text-slate-700 leading-relaxed">{comp.whyItMatters}</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-0.5">Field tip</div>
                          <p className="text-sm text-amber-900">{comp.fieldTip}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!teachingRead && (
              <div className="border-t bg-slate-50 px-5 py-4">
                <button
                  onClick={() => setTeachingRead(true)}
                  className="w-full py-3 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold transition"
                >
                  I have studied all 4 components — unlock the simulation
                </button>
              </div>
            )}

            {teachingRead && (
              <div className="border-t bg-green-50 px-5 py-3 text-center text-sm text-green-700 font-medium">
                Components reviewed. 3D simulation unlocked below.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: 3D Simulation (unlocks after teaching) ── */}
      {simulationUnlocked && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${simulationComplete ? 'bg-green-100 text-green-700' : 'bg-brand-blue-100 text-brand-blue-700'}`}>3</span>
            <span className="font-semibold text-slate-800">Identify components on the 3D model</span>
          </div>

          <HVACSimulation
            modelPath={simulation.modelPath}
            title={simulation.title}
            hotspots={[...simulation.hotspots]}
            requiredHotspotIds={[...simulation.requiredHotspotIds]}
            onComplete={() => {
              setSimulationComplete(true)
              onSimulationComplete?.()
            }}
          />
        </div>
      )}

      {/* ── Completion banner ── */}
      {simulationComplete && (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5 text-center">
          <div className="text-2xl mb-1">&#10003;</div>
          <div className="font-bold text-green-800 text-lg">Lesson Complete</div>
          <p className="text-sm text-green-700 mt-1">
            You watched the video, studied the condenser components, and identified all 4 parts on the 3D model.
          </p>
        </div>
      )}
    </div>
  )
}
