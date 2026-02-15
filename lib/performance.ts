import { logger } from '@/lib/logger';
// Performance monitoring utilities
export function measurePageLoad() {
  if (typeof window === 'undefined') return;
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;
    // Log to analytics
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: 'page_load',
        value: pageLoadTime,
        event_category: 'Performance',
      });
    }
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('Performance metric:', { pageLoadTime, connectTime, renderTime });
    }
  });
}
export function measureWebVitals() {
  if (typeof window === 'undefined') return;
  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'LCP',
        value: Math.round(lastEntry.startTime),
      });
    }
  });
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }
  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: 'FID',
          value: Math.round(entry.processingStart - entry.startTime),
        });
      }
    });
  });
  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }
  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as any[]) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    }
  });
  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }
  // Report CLS on page unload
  window.addEventListener('beforeunload', () => {
    if (window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'CLS',
        value: Math.round(clsValue * 1000),
      });
    }
  });
}
export function trackAPIPerformance(endpoint: string, duration: number) {
  if (window.gtag) {
    window.gtag('event', 'api_timing', {
      event_category: 'API Performance',
      event_label: endpoint,
      value: Math.round(duration),
    });
  }
  // Log slow API calls
  if (duration > 1000 && process.env.NODE_ENV === 'development') {
    logger.warn(`Slow API call: ${endpoint} took ${duration}ms`);
  }
}
export function trackComponentRender(componentName: string, duration: number) {
  if (process.env.NODE_ENV === 'development' && duration > 100) {
    logger.warn(`Slow component render: ${componentName} took ${duration}ms`);
  }
}
// Resource timing
export function analyzeResourceTiming() {
  if (typeof window === 'undefined') return;
  const resources = performance.getEntriesByType(
    'resource'
  ) as PerformanceResourceTiming[];
  const slowResources = resources.filter((r) => r.duration > 1000);
  if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
    logger.info(
      'Slow resources:',
      slowResources.map((r) => ({
        name: r.name,
        duration: `${Math.round(r.duration)}ms`,
        size: r.transferSize,
      }))
    );
  }
  // Track to analytics
  if (window.gtag) {
    const totalSize = resources.reduce(
      (sum, r) => sum + (r.transferSize || 0),
      0
    );
    window.gtag('event', 'resource_timing', {
      event_category: 'Performance',
      event_label: 'total_resources',
      value: resources.length,
    });
    window.gtag('event', 'resource_timing', {
      event_category: 'Performance',
      event_label: 'total_size',
      value: Math.round(totalSize / 1024), // KB
    });
  }
}
// Memory usage (if available)
export function trackMemoryUsage() {
  if (typeof window === 'undefined') return;

  const memory = (performance as any).memory;
  if (memory) {
    const usedMemory = memory.usedJSHeapSize / 1048576; // MB
    const totalMemory = memory.totalJSHeapSize / 1048576; // MB

    if (process.env.NODE_ENV === 'development') {
      console.debug(`Memory: ${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`);
    }

    if (window.gtag) {
      window.gtag('event', 'memory_usage', {
        event_category: 'Performance',
        value: Math.round(usedMemory),
      });
    }
  }
}
// Initialize all performance monitoring
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;
  measurePageLoad();
  measureWebVitals();
  // Analyze resources after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      analyzeResourceTiming();
      trackMemoryUsage();
    }, 1000);
  });
  // Track memory periodically
  setInterval(() => {
    trackMemoryUsage();
  }, 60000); // Every minute
}
