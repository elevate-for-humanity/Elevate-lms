/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

// LMS Performance Monitor
// Add this script to monitor and optimize LMS performance

class LMSPerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      courseLoadTime: 0,
      lessonLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.startTime = Date.now();
    this.setupPerformanceObserver();
  }

  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('/api/lms/')) {
            this.trackAPICall(entry);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  trackAPICall(entry) {
    const duration = entry.responseEnd - entry.requestStart;

    if (entry.name.includes('/courses')) {
      this.metrics.courseLoadTime = duration;
    } else if (entry.name.includes('/course/')) {
      this.metrics.lessonLoadTime = duration;
    }

    // Check if response came from cache (304 status or very fast response)
    if (duration < 50) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Log slow requests
    if (duration > 1000) {
    }
  }

  trackPageLoad() {
    this.metrics.pageLoadTime = Date.now() - this.startTime;
  }

  reportMetrics() {
    return {
      ...this.metrics,
      cacheEfficiency:
        (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100,
    };
  }

  // Preload critical course data
  async preloadCriticalData() {
    try {
      // Preload course list in background
      fetch('/api/lms/courses').then((response) => {
        if (response.ok) {
        }
      });

      // Preload enrolled course details
      const enrolledCourses = JSON.parse(localStorage.getItem('enrolledCourses') || '[]');
      enrolledCourses.forEach((courseId) => {
        fetch(`/api/lms/course/${courseId}`).then((response) => {
          if (response.ok) {
          }
        });
      });
    } catch (error) {}
  }
}

// Initialize performance monitoring
const lmsMonitor = new LMSPerformanceMonitor();

// Preload data when user is likely to navigate to LMS
document.addEventListener(
  'mouseover',
  (e) => {
    if (e.target.href && e.target.href.includes('/lms')) {
      lmsMonitor.preloadCriticalData();
    }
  },
  { once: true },
);

// Report metrics to server for monitoring
setInterval(() => {
  const metrics = lmsMonitor.reportMetrics();
  if (metrics.pageLoadTime > 0) {
    fetch('/_telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'lms_performance',
        metrics: metrics,
        timestamp: new Date().toISOString(),
      }),
    });
  }
}, 30000); // Report every 30 seconds

window.lmsMonitor = lmsMonitor;
