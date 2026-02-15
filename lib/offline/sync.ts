import { logger } from '@/lib/logger';

// Background sync manager for offline data
import { getDB } from './db';
export class SyncManager {
  private static instance: SyncManager;
  private syncing = false;
  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }
  async registerBackgroundSync() {
    if (
      'serviceWorker' in navigator &&
      'sync' in ServiceWorkerRegistration.prototype
    ) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as string).sync.register('sync-progress');
        //
      } catch (error) { /* Error handled silently */ 
        // Error: $1
        // Fallback to periodic sync
        this.startPeriodicSync();
      }
    } else {
      // Fallback for browsers without background sync
      this.startPeriodicSync();
    }
  }
  private startPeriodicSync() {
    // Sync every 5 minutes when online
    setInterval(
      () => {
        if (navigator.onLine) {
          this.syncNow();
        }
      },
      5 * 60 * 1000
    );
    // Sync when coming back online
    window.addEventListener('online', () => {
      //
      this.syncNow();
    });
  }
  async syncNow(): Promise<boolean> {
    if (this.syncing) {
      //
      return false;
    }
    if (!navigator.onLine) {
      //
      return false;
    }
    this.syncing = true;
    //
    try {
      const db = await getDB();
      // Sync progress
      const unsyncedProgress = await db.getUnsyncedProgress();
      //
      for (const progress of unsyncedProgress) {
        try {
          // Send to API
          const response = await fetch('/api/lms/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              courseId: progress.courseId,
              lessonId: progress.lessonId,
              progress: progress.progress,
              completed: progress.completed,
            }),
          });
          if (response.ok) {
            // Mark as synced
            if (progress.id) {
              await db.markProgressSynced(progress.id);
              //
            }
          } else {
            logger.error(
              `[Sync] Failed to sync progress:`,
              response.statusText
            );
          }
        } catch (error) { /* Error handled silently */ 
          // Error: $1
        }
      }
      // Sync queue items
      const queueItems = await db.getSyncQueue();
      //
      for (const item of queueItems) {
        try {
          const response = await fetch(item.url, {
            method: item.method || 'POST',
            headers: item.headers || { 'Content-Type': 'application/json' },
            body: item.body ? JSON.stringify(item.body) : undefined,
          });
          if (response.ok) {
            await db.removeFromSyncQueue(item.id);
            //
          }
        } catch (error) { /* Error handled silently */ 
          // Error: $1
        }
      }
      //
      this.syncing = false;
      return true;
    } catch (error) { /* Error handled silently */ 
      // Error: $1
      this.syncing = false;
      return false;
    }
  }
  async queueRequest(url: string, options: RequestInit = {}): Promise<void> {
    const db = await getDB();
    await db.addToSyncQueue({
      url,
      method: options.method || 'POST',
      headers: options.headers,
      body: options.body,
      type: 'api-request',
    });
    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncNow();
    }
  }
}
// Initialize sync manager
export function initSync() {
  const syncManager = SyncManager.getInstance();
  syncManager.registerBackgroundSync();
  // Listen for online/offline events
  window.addEventListener('online', () => {
    //
    syncManager.syncNow();
  });
  window.addEventListener('offline', () => {
    //
  });
}
export default SyncManager;
