// 📊 Elevate Download Tracking System
// Integrates with backend license system for comprehensive analytics

class DownloadTracker {
  constructor() {
    this.apiBase = window.location.origin;
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  generateSessionId() {
    return 'dt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Track download initiation
  async trackDownload(email, productId, licenseKey = null, fileName = null) {
    const trackingData = {
      email,
      productId,
      licenseKey,
      fileName,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      pageUrl: window.location.href,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    try {
      const response = await fetch(`${this.apiBase}/api/log-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
        body: JSON.stringify(trackingData),
      });

      if (response.ok) {
        this.showTrackingNotification('Download started - tracking enabled');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  // Track download completion
  async trackDownloadComplete(email, productId, licenseKey, fileName, success = true) {
    const completionData = {
      email,
      productId,
      licenseKey,
      fileName,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      success,
      duration: Date.now() - this.startTime,
      action: 'DOWNLOAD_COMPLETED',
    };

    try {
      await fetch(`${this.apiBase}/api/log-download-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
        body: JSON.stringify(completionData),
      });

      if (success) {
        this.showTrackingNotification('Download completed successfully');
      }
    } catch (error) {}
  }

  // Track download errors
  async trackDownloadError(email, productId, licenseKey, error, fileName = null) {
    const errorData = {
      email,
      productId,
      licenseKey,
      fileName,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      error: error.message || error,
      action: 'DOWNLOAD_ERROR',
    };

    try {
      await fetch(`${this.apiBase}/api/log-download-error`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId,
        },
        body: JSON.stringify(errorData),
      });

      this.showTrackingNotification('Download error reported', 'error');
    } catch (trackingError) {}
  }

  // Validate license before download
  async validateLicense(licenseKey) {
    try {
      const response = await fetch(`${this.apiBase}/api/validate-license/${licenseKey}`, {
        method: 'GET',
        headers: {
          'X-Session-ID': this.sessionId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error('License validation failed');
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Show tracking notification to user
  showTrackingNotification(message, type = 'info') {
    // Only show if user hasn't disabled notifications
    if (localStorage.getItem('elevate_tracking_notifications') === 'disabled') {
      return;
    }

    const notification = document.createElement('div');
    notification.className = `tracking-notification tracking-${type}`;
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#fee' : '#f0f8ff'};
        color: ${type === 'error' ? '#c53030' : '#2563eb'};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
        border-left: 4px solid ${type === 'error' ? '#c53030' : '#2563eb'};
      ">
        ${message}
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          float: right;
          cursor: pointer;
          margin-left: 10px;
          color: inherit;
        ">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Enhanced download with progress tracking
  async downloadWithProgress(url, fileName, licenseKey, email, productId) {
    try {
      // Start tracking
      await this.trackDownload(email, productId, licenseKey, fileName);

      // Create progress indicator
      const progressContainer = this.createProgressIndicator(fileName);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Update progress
        if (total) {
          const progress = (loaded / total) * 100;
          this.updateProgress(progressContainer, progress);
        }
      }

      // Create blob and download
      const blob = new Blob(chunks);
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // Track completion
      await this.trackDownloadComplete(email, productId, licenseKey, fileName, true);

      // Remove progress indicator
      setTimeout(() => progressContainer.remove(), 2000);
    } catch (error) {
      await this.trackDownloadError(email, productId, licenseKey, error, fileName);
      throw error;
    }
  }

  createProgressIndicator(fileName) {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 10001;
        min-width: 300px;
        text-align: center;
      ">
        <h3 style="margin: 0 0 15px 0;">Downloading ${fileName}</h3>
        <div style="
          background: #f0f0f0;
          border-radius: 10px;
          height: 20px;
          overflow: hidden;
          margin-bottom: 10px;
        ">
          <div class="progress-bar" style="
            background: linear-gradient(90deg, #10b981, #059669);
            height: 100%;
            width: 0%;
            transition: width 0.3s ease;
          "></div>
        </div>
        <div class="progress-text">Preparing download...</div>
      </div>
    `;

    document.body.appendChild(container);
    return container;
  }

  updateProgress(container, progress) {
    const progressBar = container.querySelector('.progress-bar');
    const progressText = container.querySelector('.progress-text');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `${Math.round(progress)}% complete`;
    }
  }
}

// Global instance
window.downloadTracker = new DownloadTracker();

// Convenience functions for backward compatibility
window.trackDownload = (email, productId, licenseKey, fileName) => {
  return window.downloadTracker.trackDownload(email, productId, licenseKey, fileName);
};

window.validateLicense = (licenseKey) => {
  return window.downloadTracker.validateLicense(licenseKey);
};

window.downloadWithProgress = (url, fileName, licenseKey, email, productId) => {
  return window.downloadTracker.downloadWithProgress(url, fileName, licenseKey, email, productId);
};

// Auto-track page views for license-related pages
if (
  window.location.pathname.includes('/download') ||
  window.location.pathname.includes('/license')
) {
  // Track page view
  fetch('/api/log-page-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      sessionId: window.downloadTracker.sessionId,
      referrer: document.referrer,
    }),
  }).catch(console.error);
}
