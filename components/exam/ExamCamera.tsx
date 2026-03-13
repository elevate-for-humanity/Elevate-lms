'use client'

import { useEffect, useRef, useState } from 'react'
import { logExamEvent } from '@/lib/exams/log-event'

type Props = {
  examSessionId: string
  showPreview?: boolean
}

export default function ExamCamera({
  examSessionId,
  showPreview = true
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [status, setStatus] = useState<'idle' | 'recording' | 'failed'>('idle')

  useEffect(() => {
    let mounted = true

    const stopEverything = async () => {
      try {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop()
        }
      } catch (error) {
        console.warn('Recorder stop failed:', error)
      }

      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop()
        }
      }

      streamRef.current = null
      recorderRef.current = null
    }

    const uploadRecording = async () => {
      try {
        if (!chunksRef.current.length) return

        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const file = new File([blob], 'exam-' + examSessionId + '.webm', {
          type: 'video/webm'
        })

        const formData = new FormData()
        formData.append('file', file)
        formData.append('sessionId', examSessionId)

        const res = await fetch('/api/exams/upload-recording', {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          await logExamEvent({
            examSessionId,
            eventType: 'recording_uploaded',
            metadata: { size: blob.size }
          })
        } else {
          // Upload failed — log to exam events so the session gets flagged
          await logExamEvent({
            examSessionId,
            eventType: 'camera_stopped',
            metadata: { reason: 'upload_failed', status: res.status }
          })
        }
      } catch (error) {
        // Network failure — log so the trigger flags the session
        await logExamEvent({
          examSessionId,
          eventType: 'camera_stopped',
          metadata: {
            reason: 'upload_exception',
            message: error instanceof Error ? error.message : 'Unknown'
          }
        }).catch(() => {})
      }
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })

        if (!mounted) return

        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          try {
            await videoRef.current.play()
          } catch (error) {
            console.warn('Preview play failed:', error)
          }
        }

        await logExamEvent({
          examSessionId,
          eventType: 'camera_started'
        })

        const recorder = new MediaRecorder(stream, {
          mimeType: 'video/webm'
        })

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }

        recorder.onstop = async () => {
          await uploadRecording()
          await logExamEvent({
            examSessionId,
            eventType: 'camera_stopped'
          })
        }

        recorderRef.current = recorder
        recorder.start(5000)
        setStatus('recording')
      } catch (error) {
        console.error('Camera start failed:', error)
        setStatus('failed')
        await logExamEvent({
          examSessionId,
          eventType: 'camera_denied',
          metadata: {
            message: error instanceof Error ? error.message : 'Unknown camera error'
          }
        })
      }
    }

    void start()

    return () => {
      mounted = false
      void stopEverything()
    }
  }, [examSessionId])

  if (!showPreview) return null

  return (
    <div className="rounded-lg border p-2 bg-black/5">
      <div className="text-xs font-medium mb-2">
        Camera status: {status}
      </div>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-48 rounded border bg-black"
      />
    </div>
  )
}
