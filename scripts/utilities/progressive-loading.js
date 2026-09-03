// Progressive Loading Strategy for Heavy Video Build
class ProgressiveLoader {
  constructor() {
    this.loadingQueue = [];
    this.loadedResources = new Set();
    this.priorityLevels = {
      critical: 1,
      important: 2,
      normal: 3,
      lazy: 4,
    };
  }

  // Add resource to loading queue with priority
  addResource(element, priority = 'normal', callback = null) {
    this.loadingQueue.push({
      element,
      priority: this.priorityLevels[priority],
      callback,
      loaded: false,
    });
  }

  // Sort queue by priority
  sortQueue() {
    this.loadingQueue.sort((a, b) => a.priority - b.priority);
  }

  // Load resources progressively
  async loadResources() {
    this.sortQueue();

    for (const resource of this.loadingQueue) {
      if (resource.loaded) continue;

      try {
        await this.loadResource(resource);
        resource.loaded = true;

        if (resource.callback) {
          resource.callback();
        }

        // Small delay between loads to prevent blocking
        await this.delay(50);
      } catch (error) {}
    }
  }

  // Load individual resource
  loadResource(resource) {
    return new Promise((resolve, reject) => {
      const element = resource.element;

      if (element.tagName === 'VIDEO') {
        this.loadVideo(element).then(resolve).catch(reject);
      } else if (element.tagName === 'IMG') {
        this.loadImage(element).then(resolve).catch(reject);
      } else {
        resolve();
      }
    });
  }

  // Load video with optimization
  loadVideo(videoElement) {
    return new Promise((resolve, reject) => {
      const source = videoElement.querySelector('source[data-src]');
      if (!source) {
        resolve();
        return;
      }

      const tempVideo = document.createElement('video');
      tempVideo.onloadeddata = () => {
        source.src = source.dataset.src;
        videoElement.load();
        this.loadedResources.add(source.dataset.src);
        resolve();
      };

      tempVideo.onerror = reject;
      tempVideo.src = source.dataset.src;
    });
  }

  // Load image with optimization
  loadImage(imgElement) {
    return new Promise((resolve, reject) => {
      if (imgElement.dataset.src) {
        imgElement.onload = resolve;
        imgElement.onerror = reject;
        imgElement.src = imgElement.dataset.src;
      } else {
        resolve();
      }
    });
  }

  // Utility delay function
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Initialize progressive loading
  init() {
    // Find all videos and add to queue
    document.querySelectorAll('video').forEach((video) => {
      const isAboveFold = video.getBoundingClientRect().top < window.innerHeight;
      const priority = isAboveFold ? 'critical' : 'lazy';
      this.addResource(video, priority);
    });

    // Find all images with data-src and add to queue
    document.querySelectorAll('img[data-src]').forEach((img) => {
      const isAboveFold = img.getBoundingClientRect().top < window.innerHeight;
      const priority = isAboveFold ? 'important' : 'normal';
      this.addResource(img, priority);
    });

    // Start loading after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.loadResources());
    } else {
      this.loadResources();
    }
  }
}

// Initialize progressive loader
const progressiveLoader = new ProgressiveLoader();
progressiveLoader.init();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProgressiveLoader;
}
