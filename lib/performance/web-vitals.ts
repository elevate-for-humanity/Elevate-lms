// Minimal safe metrics collector for dev
export function initWebVitalsDebug() {
  if (typeof window === 'undefined') return;

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // Ignore layout shifts from recent input
        if (entry?.hadRecentInput) continue;
        if (process.env.NODE_ENV === 'development') {
          // Safe logging
        }
      }
    });
    // CLS entries
    po.observe({ type: 'layout-shift', buffered: true } as PerformanceObserverInit);

    // Resource summary (dev only)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource') as any[];
        const total = resources.reduce((a, r) => a + (r.transferSize || 0), 0);
        const byType: Record<string, number> = {};
        for (const r of resources) {
          const t = r.initiatorType || 'other';
          byType[t] = (byType[t] || 0) + (r.transferSize || 0);
        }
      }, 3000);
    }
  } catch (error) {
    /* no-op for unsupported browsers */
  }
}
