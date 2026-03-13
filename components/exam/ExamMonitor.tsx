'use client'

import { useExamMonitoring } from './useExamMonitoring'

export default function ExamMonitor({
  examSessionId
}: {
  examSessionId: string
}) {
  useExamMonitoring({ examSessionId })
  return null
}
