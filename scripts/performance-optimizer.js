const fs = require('fs');
const path = require('path');

// Performance optimization for video-heavy build
class PerformanceOptimizer {
  constructor() {
    this.optimizations = {
      videos: [],
      images: [],
      css: [],
      js: [],
    };
  }

  // Optimize HTML for better rendering
  optimizeHTML(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Add preload hints for critical resources
    const preloadHints = `
    <!-- Critical Resource Preloads -->
    <link rel="preload" href="/videos/transformation-stories.mp4" as="video" type="video/mp4">
    <link rel="preload" href="/videos/ai-lab-action.mp4" as="video" type="video/mp4">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <!-- Critical CSS inline -->
    <style>
      /* Critical above-the-fold styles */
      body { font-family: 'Inter', sans-serif; margin: 0; }
      .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
      .hero-content { max-width: 900px; text-align: center; color: white; z-index: 3; position: relative; }
    </style>`;

    // Insert preload hints after <head>
    content = content.replace('<head>', '<head>' + preloadHints);

    // Add lazy loading to videos
    content = content.replace(/<video([^>]*?)>/g, '<video$1 loading="lazy" preload="metadata">');

    // Add intersection observer for video loading
    const videoOptimizationScript = `
    <script>
      // Intersection Observer for video optimization
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const video = entry.target;
            if (video.dataset.src) {
              video.src = video.dataset.src;
              video.load();
              videoObserver.unobserve(video);
            }
          }
        });
      }, { threshold: 0.1 });

      // Observe all videos
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('video[data-src]').forEach(video => {
          videoObserver.observe(video);
        });
      });
    </script>`;

    // Insert before closing body tag
    content = content.replace('</body>', videoOptimizationScript + '</body>');

    return content;
  }

  // Create optimized video loading strategy
  createVideoLoadingStrategy() {
    return `
    <!-- Video Loading Strategy -->
    <script>
      class VideoManager {
        constructor() {
          this.loadedVideos = new Set();
          this.videoQueue = [];
          this.maxConcurrentLoads = 2;
          this.currentLoads = 0;
        }

        // Progressive video loading
        loadVideo(videoElement) {
          return new Promise((resolve, reject) => {
            if (this.loadedVideos.has(videoElement.src)) {
              resolve();
              return;
            }

            if (this.currentLoads >= this.maxConcurrentLoads) {
              this.videoQueue.push(() => this.loadVideo(videoElement));
              return;
            }

            this.currentLoads++;

            const tempVideo = document.createElement('video');
            tempVideo.onloadeddata = () => {
              videoElement.src = tempVideo.src;
              this.loadedVideos.add(videoElement.src);
              this.currentLoads--;
              this.processQueue();
              resolve();
            };

            tempVideo.onerror = () => {
              this.currentLoads--;
              this.processQueue();
              reject();
            };

            tempVideo.src = videoElement.dataset.src;
          });
        }

        processQueue() {
          if (this.videoQueue.length > 0 && this.currentLoads < this.maxConcurrentLoads) {
            const nextLoad = this.videoQueue.shift();
            nextLoad();
          }
        }

        // Initialize on page load
        init() {
          const videos = document.querySelectorAll('video[data-src]');
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                this.loadVideo(entry.target);
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.1, rootMargin: '50px' });

          videos.forEach(video => observer.observe(video));
        }
      }

      // Initialize video manager
      document.addEventListener('DOMContentLoaded', () => {
        new VideoManager().init();
      });
    </script>`;
  }

  // Generate structured data for rich snippets
  generateStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Elevate for Humanity',
      alternateName: 'Rise Forward Foundation',
      description:
        'Transforming lives through technology education, AI training, and workforce development programs.',
      url: 'https://elevateforhumanity.org',
      logo: 'https://elevateforhumanity.org/images/logo.png',
      sameAs: [
        'https://www.linkedin.com/company/elevate-for-humanity',
        'https://www.facebook.com/61578240192934/',
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US',
        addressRegion: 'IN',
      },
      offers: [
        {
          '@type': 'Course',
          name: 'AI & Data Science Bootcamp',
          description: 'Comprehensive AI and machine learning training program',
          provider: {
            '@type': 'Organization',
            name: 'Elevate for Humanity',
          },
          courseMode: 'blended',
          educationalCredentialAwarded: 'Professional Certificate',
        },
        {
          '@type': 'Course',
          name: 'WIOA Workforce Development',
          description: 'Federally-funded workforce training programs',
          provider: {
            '@type': 'Organization',
            name: 'Elevate for Humanity',
          },
          courseMode: 'blended',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
      ],
      video: [
        {
          '@type': 'VideoObject',
          name: 'Transformation Stories - Seeds of Change',
          description: 'Real student success stories and career transformations',
          thumbnailUrl:
            'https://elevateforhumanity.org/images/video-thumbnails/transformation-stories.jpg',
          uploadDate: '2025-09-16',
          duration: 'PT2M30S',
        },
        {
          '@type': 'VideoObject',
          name: 'AI Lab in Action - Laboratory of Dreams',
          description: 'Tour of our state-of-the-art AI development facilities',
          thumbnailUrl: 'https://elevateforhumanity.org/images/video-thumbnails/ai-lab-tour.jpg',
          uploadDate: '2025-09-16',
          duration: 'PT1M30S',
        },
      ],
    };
  }

  // Create performance monitoring
  createPerformanceMonitoring() {
    return `
    <script>
      // Core Web Vitals monitoring
      function measureCoreWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];

          // Send to analytics
          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: 'LCP',
              value: Math.round(lastEntry.startTime)
            });
          }
        }).observe({entryTypes: ['largest-contentful-paint']});

        // First Input Delay
        new PerformanceObserver((entryList) => {
          const firstInput = entryList.getEntries()[0];

          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: 'FID',
              value: Math.round(firstInput.processingStart - firstInput.startTime)
            });
          }
        }).observe({entryTypes: ['first-input']});

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }

          if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: 'CLS',
              value: Math.round(clsValue * 1000)
            });
          }
        }).observe({entryTypes: ['layout-shift']});
      }

      // Initialize monitoring
      if (document.readyState === 'complete') {
        measureCoreWebVitals();
      } else {
        window.addEventListener('load', measureCoreWebVitals);
      }
    </script>`;
  }

  // Optimize all files
  optimizeAll() {
    // Optimize main HTML file
    if (fs.existsSync('index.html')) {
      const optimizedHTML = this.optimizeHTML('index.html');

      // Add structured data
      const structuredData = this.generateStructuredData();
      const structuredDataScript = `
      <script type="application/ld+json">
      ${JSON.stringify(structuredData, null, 2)}
      </script>`;

      // Add performance monitoring
      const performanceScript = this.createPerformanceMonitoring();

      // Insert before closing head tag
      const finalHTML = optimizedHTML
        .replace('</head>', structuredDataScript + '</head>')
        .replace('</body>', performanceScript + '</body>');

      fs.writeFileSync('index-optimized.html', finalHTML);
    }

    // Create video loading strategy file
    const videoStrategy = this.createVideoLoadingStrategy();
    fs.writeFileSync('video-loading-strategy.html', videoStrategy);
  }
}

// Run optimization
const optimizer = new PerformanceOptimizer();
optimizer.optimizeAll();
