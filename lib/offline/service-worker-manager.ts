/**
 * Service Worker Manager
 * Handles service worker registration, updates, and offline sync coordination
 */
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private syncListeners: Set<(event: SyncEvent) => void> = new Set();
  /**
   * Register service worker and set up event listeners
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const hostname = window.location.hostname;
      const workerPath = hostname.startsWith('admin.')
        ? '/sw-admin.js'
        : hostname.startsWith('app.') || hostname.startsWith('lms.')
          ? '/sw-lms.js'
          : '/sw-marketing.js';
      this.registration = await navigator.serviceWorker.register(workerPath, {
        scope: '/',
        updateViaCache: 'none',
      });
      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.notifyUpdate();
            }
          });
        }
      });
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event);
      });
      // Check for updates periodically
      setInterval(
        () => {
          this.registration?.update();
        },
        60 * 60 * 1000,
      ); // Check every hour
      return this.registration;
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return null;
    }
  }
  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;
    try {
      const result = await this.registration.unregister();
      return result;
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      return false;
    }
  }
  /**
   * Update service worker immediately
   */
  async update(): Promise<void> {
    if (!this.registration) return;
    try {
      await this.registration.update();
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
  /**
   * Skip waiting and activate new service worker
   */
  skipWaiting(): void {
    if (!this.registration?.waiting) return;
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (!this.registration?.active) return;
    this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
    // Also clear caches directly
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.filter((name) => name.startsWith('elevate-')).map((name) => caches.delete(name)),
      );
    }
  }
  /**
   * Request background sync
   */
  async requestSync(tag: string = 'sync-offline-actions'): Promise<void> {
    if (!this.registration) {
      return;
    }
    if (!('sync' in this.registration)) {
      // Fallback: trigger sync manually
      await this.manualSync();
      return;
    }
    try {
      const syncManager = (this.registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync;
      await syncManager.register(tag);
    } catch (error) {
      /* Error handled silently */
      // Error: $1
      // Fallback to manual sync
      await this.manualSync();
    }
  }
  /**
   * Manual sync fallback for browsers without Background Sync API
   */
  private async manualSync(): Promise<void> {
    try {
      const { OfflineDB } = await import('./offline-db');
      const db = new OfflineDB();
      await db.init();
      const actions = await db.getAllOfflineActions();
      if (actions.length === 0) return;
      for (const action of actions) {
        try {
          const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });
          if (response.ok) {
            await db.deleteOfflineAction(action.id);
          }
        } catch (error) {
          /* Error handled silently */
          // Error logged
        }
      }
      this.notifySyncComplete(actions.length);
    } catch (error) {
      /* Error handled silently */
      // Error: $1
    }
  }
  /**
   * Add sync event listener
   */
  onSync(callback: (event: SyncEvent) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }
  /**
   * Handle messages from service worker
   */
  private handleMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    switch (type) {
      case 'SYNC_COMPLETE':
        this.notifySyncComplete(data.syncedCount);
        break;
      case 'CACHE_UPDATED':
        break;
      default:
    }
  }
  /**
   * Notify about service worker update
   */
  private notifyUpdate(): void {
    const event = new CustomEvent('sw-update', {
      detail: { registration: this.registration },
    });
    window.dispatchEvent(event);
  }
  /**
   * Notify about sync completion
   */
  private notifySyncComplete(syncedCount: number): void {
    const event = new CustomEvent('sw-sync-complete', {
      detail: { syncedCount },
    });
    window.dispatchEvent(event);
    this.syncListeners.forEach((listener) => {
      listener({ syncedCount });
    });
  }
  /**
   * Check if service worker is ready
   */
  isReady(): boolean {
    return this.registration !== null && navigator.serviceWorker.controller !== null;
  }
  /**
   * Get current registration
   */
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}
// Sync event type
export interface SyncEvent {
  syncedCount: number;
}
// Singleton instance
let instance: ServiceWorkerManager | null = null;
/**
 * Get singleton instance of ServiceWorkerManager
 */
export function getServiceWorkerManager(): ServiceWorkerManager {
  if (!instance) {
    instance = new ServiceWorkerManager();
  }
  return instance;
}
/**
 * Initialize service worker on app load
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  const manager = getServiceWorkerManager();
  return manager.register();
}
/**
 * Request offline sync
 */
export async function syncOfflineActions(): Promise<void> {
  const manager = getServiceWorkerManager();
  await manager.requestSync();
}
/**
 * Listen for online/offline events and trigger sync
 */
export function setupOfflineSync(): void {
  window.addEventListener('online', async () => {
    await syncOfflineActions();
  });
  window.addEventListener('offline', () => {
    // User went offline - data will be queued locally
  });
}
