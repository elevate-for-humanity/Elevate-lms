import { logger } from "@/lib/logger";
export type ExamEventType =
  | 'exam_started'
  | 'exam_submitted'
  | 'tab_hidden'
  | 'tab_visible'
  | 'window_blur'
  | 'window_focus'
  | 'fullscreen_enter'
  | 'fullscreen_exit'
  | 'camera_started'
  | 'camera_denied'
  | 'camera_stopped'
  | 'recording_uploaded'
  | 'devtools_detected'
  | 'automation_detected'
  | 'copy_blocked'
  | 'paste_blocked'
  | 'right_click_blocked'
  | 'print_blocked'
  | 'keydown_blocked'

export async function logExamEvent(params: {
  examSessionId: string
  eventType: ExamEventType
  metadata?: Record<string, unknown>
}) {
  const res = await fetch('/api/exams/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam_session_id: params.examSessionId,
      event_type: params.eventType,
      metadata: params.metadata ?? {}
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    logger.error('Failed to log exam event', undefined, { status: res.status, body: text })
  }
}
