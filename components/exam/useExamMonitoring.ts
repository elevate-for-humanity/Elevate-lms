'use client'

import { useCallback, useEffect, useRef } from 'react'
import { logExamEvent } from '@/lib/exams/log-event'

type UseExamMonitoringOptions = {
  examSessionId: string
  enableFullscreen?: boolean
  blockClipboard?: boolean
  blockContextMenu?: boolean
  blockPrint?: boolean
  detectDevtools?: boolean
}

export function useExamMonitoring({
  examSessionId,
  enableFullscreen = true,
  blockClipboard = true,
  blockContextMenu = true,
  blockPrint = true,
  detectDevtools = true
}: UseExamMonitoringOptions) {
  const devtoolsLoggedRef = useRef(false)

  const safeLog = useCallback(
    async (eventType: Parameters<typeof logExamEvent>[0]['eventType'], metadata?: Record<string, unknown>) => {
      try {
        await logExamEvent({ examSessionId, eventType, metadata })
      } catch (error) {
        console.error('Exam event logging failed:', error)
      }
    },
    [examSessionId]
  )

  const enterFullscreen = useCallback(async () => {
    if (!enableFullscreen) return
    const el = document.documentElement
    if (!document.fullscreenElement && el.requestFullscreen) {
      try {
        await el.requestFullscreen()
        await safeLog('fullscreen_enter')
      } catch (error) {
        console.warn('Fullscreen request failed:', error)
      }
    }
  }, [enableFullscreen, safeLog])

  useEffect(() => {
    void safeLog('exam_started', {
      url: window.location.href,
      userAgent: navigator.userAgent
    })

    void enterFullscreen()

    const onVisibilityChange = () => {
      if (document.hidden) {
        void safeLog('tab_hidden')
      } else {
        void safeLog('tab_visible')
      }
    }

    const onWindowBlur = () => {
      void safeLog('window_blur')
    }

    const onWindowFocus = () => {
      void safeLog('window_focus')
    }

    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        void safeLog('fullscreen_exit')
      } else {
        void safeLog('fullscreen_enter')
      }
    }

    const onCopy = (e: ClipboardEvent) => {
      if (!blockClipboard) return
      e.preventDefault()
      void safeLog('copy_blocked')
    }

    const onPaste = (e: ClipboardEvent) => {
      if (!blockClipboard) return
      e.preventDefault()
      void safeLog('paste_blocked')
    }

    const onContextMenu = (e: MouseEvent) => {
      if (!blockContextMenu) return
      e.preventDefault()
      void safeLog('right_click_blocked')
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const blocked =
        e.key === 'PrintScreen' ||
        (e.ctrlKey && ['c', 'v', 'p', 's', 'u'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'

      if (blocked) {
        e.preventDefault()
        e.stopPropagation()
        void safeLog('keydown_blocked', {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey
        })
      }
    }

    let devtoolsInterval: number | undefined
    if (detectDevtools) {
      devtoolsInterval = window.setInterval(() => {
        const widthGap = window.outerWidth - window.innerWidth > 160
        const heightGap = window.outerHeight - window.innerHeight > 160
        if ((widthGap || heightGap) && !devtoolsLoggedRef.current) {
          devtoolsLoggedRef.current = true
          void safeLog('devtools_detected', {
            outerWidth: window.outerWidth,
            innerWidth: window.innerWidth,
            outerHeight: window.outerHeight,
            innerHeight: window.innerHeight
          })
        }
      }, 2000)
    }

    const beforePrint = () => {
      if (!blockPrint) return
      void safeLog('print_blocked')
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('focus', onWindowFocus)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeprint', beforePrint)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('focus', onWindowFocus)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('beforeprint', beforePrint)
      if (devtoolsInterval) window.clearInterval(devtoolsInterval)
    }
  }, [
    blockClipboard,
    blockContextMenu,
    blockPrint,
    detectDevtools,
    enterFullscreen,
    safeLog
  ])

  return {
    logEvent: safeLog,
    enterFullscreen
  }
}
