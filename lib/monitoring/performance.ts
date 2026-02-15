import { logger } from '@/lib/logger';
// Performance Monitoring

export const measurePageLoad = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;

    return {
      pageLoadTime,
      connectTime,
      renderTime,
    };
  }
  return null;
};

export const measureWebVitals = (metric: any) => {
  // Log Web Vitals

  // Send to analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
};

export const trackResourceTiming = () => {
  if (typeof window !== 'undefined' && window.performance) {
    const resources = window.performance.getEntriesByType('resource');
    const slowResources = resources.filter((r: any) => r.duration > 1000);

    if (slowResources.length > 0) {
      logger.warn('Slow resources detected:', slowResources);
    }

    return {
      totalResources: resources.length,
      slowResources: slowResources.length,
    };
  }
  return null;
};
