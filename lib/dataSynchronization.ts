/**
 * Data Synchronization Utility for Next.js App Router
 * Ensures real-time data consistency across the application
 * Handles Supabase real-time updates, conflict resolution, and offline sync
 */
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
type DatabasePayload = {
  old: Record<string, any>;
  new: Record<string, any>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  commit_timestamp: string;
};
interface SyncConfig {
  table: string;
  onUpdate: (payload: DatabasePayload) => void;
  onInsert?: (payload: DatabasePayload) => void;
  onDelete?: (payload: DatabasePayload) => void;
  filter?: Record<string, any>;
}
interface PendingChange {
  operation: 'insert' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: number;
}
interface SyncState {
  lastSync: Date;
  pendingChanges: PendingChange[];
  isOnline: boolean;
  syncInProgress: boolean;
}
class DataSynchronizationManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map();
  private syncState: Map<string, SyncState> = new Map();
  private retryQueue: Map<string, PendingChange[]> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000;
  /**
   * Subscribe to real-time updates for a table
   */
  subscribe(config: SyncConfig): () => void {
    const supabase = createClient();
    const { table, onUpdate, onInsert, onDelete, filter } = config;
    const channelName = `sync_${table}_${Date.now()}`;
    // Initialize sync state
    this.syncState.set(table, {
      lastSync: new Date(),
      pendingChanges: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      syncInProgress: false,
    });
    // Create channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: filter ? this.buildFilter(filter) : undefined,
        },
        (payload) => {
          //
          onUpdate(payload);
          this.updateSyncState(table);
        }
      );
    if (onInsert) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: filter ? this.buildFilter(filter) : undefined,
        },
        (payload) => {
          //
          onInsert(payload);
          this.updateSyncState(table);
        }
      );
    }
    if (onDelete) {
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table,
          filter: filter ? this.buildFilter(filter) : undefined,
        },
        (payload) => {
          //
          onDelete(payload);
          this.updateSyncState(table);
        }
      );
    }
    channel.subscribe((status) => {
      //
    });
    this.subscriptions.set(channelName, channel);
    // Return cleanup function
    return () => {
      //
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
      this.syncState.delete(table);
    };
  }
  /**
   * Sync data with retry logic
   */
  async syncData(
    table: string,
    data: Record<string, any>,
    operation: 'insert' | 'update' | 'delete'
  ): Promise<boolean> {
    const supabase = createClient();
    const state = this.syncState.get(table);
    if (!state) {
      // Error logged
      return false;
    }
    if (!state.isOnline) {
      //
      this.queueChange(table, { data, operation, timestamp: Date.now() });
      return false;
    }
    state.syncInProgress = true;
    try {
      let result;
      switch (operation) {
        case 'insert':
          result = await supabase.from(table).insert(data);
          break;
        case 'update':
          result = await supabase
            .from(table)
            .update(data)
            .eq('id', data.id);
          break;
        case 'delete':
          result = await supabase.from(table).delete().eq('id', data.id);
          break;
      }
      if (result.error) {
        throw result.error;
      }
      //
      this.updateSyncState(table);
      return true;
    } catch (error) { /* Error handled silently */ 
      // Error logged
      await this.retrySync(table, data, operation);
      return false;
    } finally {
      state.syncInProgress = false;
    }
  }
  /**
   * Retry failed sync operations
   */
  private async retrySync(
    table: string,
    data: Record<string, any>,
    operation: 'insert' | 'update' | 'delete',
    attempt: number = 1
  ): Promise<void> {
    if (attempt > this.maxRetries) {
      logger.error(
        `[Sync] Max retries reached for ${operation} on ${table}`
      );
      this.queueChange(table, { data, operation, timestamp: Date.now() });
      return;
    }
    const delay = this.retryDelay * Math.pow(2, attempt - 1);
    //  in ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    const success = await this.syncData(table, data, operation);
    if (!success) {
      await this.retrySync(table, data, operation, attempt + 1);
    }
  }
  /**
   * Queue changes for offline sync
   */
  private queueChange(table: string, change: PendingChange): void {
    const queue = this.retryQueue.get(table) || [];
    queue.push(change);
    this.retryQueue.set(table, queue);
    const state = this.syncState.get(table);
    if (state) {
      state.pendingChanges = queue;
    }
    //
  }
  /**
   * Process queued changes when back online
   */
  async processQueue(table: string): Promise<void> {
    const queue = this.retryQueue.get(table);
    if (!queue || queue.length === 0) {
      return;
    }
    //
    for (const change of queue) {
      const success = await this.syncData(
        table,
        change.data,
        change.operation
      );
      if (success) {
        // Remove from queue
        const index = queue.indexOf(change);
        if (index > -1) {
          queue.splice(index, 1);
        }
      }
    }
    this.retryQueue.set(table, queue);
    const state = this.syncState.get(table);
    if (state) {
      state.pendingChanges = queue;
    }
  }
  /**
   * Update sync state
   */
  private updateSyncState(table: string): void {
    const state = this.syncState.get(table);
    if (state) {
      state.lastSync = new Date();
    }
  }
  /**
   * Build filter string for Supabase
   */
  private buildFilter(filter: Record<string, any>): string {
    return Object.entries(filter)
      .map(([key, value]) => `${key}=eq.${value}`)
      .join(',');
  }
  /**
   * Monitor online/offline status
   */
  monitorConnectivity(table: string): () => void {
    if (typeof window === 'undefined') return () => {
      // Server-side: no cleanup needed
    };
    const handleOnline = () => {
      //
      const state = this.syncState.get(table);
      if (state) {
        state.isOnline = true;
        this.processQueue(table);
      }
    };
    const handleOffline = () => {
      //
      const state = this.syncState.get(table);
      if (state) {
        state.isOnline = false;
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  /**
   * Get sync state for a table
   */
  getSyncState(table: string): SyncState | undefined {
    return this.syncState.get(table);
  }
  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    //
    this.subscriptions.forEach((channel) => {
      channel.unsubscribe();
    });
    this.subscriptions.clear();
    this.syncState.clear();
    this.retryQueue.clear();
  }
}
// Export singleton instance
export const dataSyncManager = new DataSynchronizationManager();
/**
 * React hook for data synchronization
 */
export function useDataSync(config: SyncConfig) {
  if (typeof window === 'undefined') return undefined;
  const cleanup = dataSyncManager.subscribe(config);
  dataSyncManager.monitorConnectivity(config.table);
  return cleanup;
}
/**
 * Conflict resolution strategies
 */
export const ConflictResolution = {
  /**
   * Server wins - always use server data
   */
  serverWins: (serverData: Record<string, any>, _localData: Record<string, any>) => serverData,
  /**
   * Client wins - always use local data
   */
  clientWins: (_serverData: Record<string, any>, localData: Record<string, any>) => localData,
  /**
   * Last write wins - use most recent timestamp
   */
  lastWriteWins: (serverData: Record<string, any>, localData: Record<string, any>) => {
    const serverTime = new Date((serverData.updated_at || serverData.created_at) as string);
    const localTime = new Date((localData.updated_at || localData.created_at) as string);
    return serverTime > localTime ? serverData : localData;
  },
  /**
   * Merge - combine both datasets
   */
  merge: (serverData: Record<string, any>, localData: Record<string, any>) => {
    return { ...serverData, ...localData };
  },
};
export default dataSyncManager;
