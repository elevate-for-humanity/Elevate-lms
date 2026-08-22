'use client';

import { offlineDB } from '@/lib/offline/offline-db';

export type QueuedTimeclockAction = 'clock_in' | 'lunch_start' | 'lunch_end' | 'clock_out';

export interface QueuedTimeclockPayload {
  action: QueuedTimeclockAction;
  apprentice_id?: string;
  partner_id?: string;
  program_id?: string;
  site_id: string;
  progress_entry_id?: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  offline_replay: true;
  client_shift_id: string;
  client_recorded_at: string;
}

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createClientShiftId(): string {
  return randomId();
}

async function askWorkerToSync(): Promise<void> {
  if (!navigator.onLine || !('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sync = (registration as ServiceWorkerRegistration & {
      sync?: { register(tag: string): Promise<void> };
    }).sync;
    if (sync) await sync.register('sync-timeclock');
    registration.active?.postMessage({ type: 'SYNC_TIMECLOCK' });
  } catch {
    // The durable queue remains intact; the online listener retries later.
  }
}

export async function queueTimeclockAction(payload: QueuedTimeclockPayload): Promise<number> {
  const id = await offlineDB.addOfflineAction({
    type: 'timeclock',
    url: '/api/timeclock/action',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timestamp: Date.parse(payload.client_recorded_at) || Date.now(),
    retryCount: 0,
  });

  if (navigator.onLine) void askWorkerToSync();
  return id;
}

export async function getPendingTimeclockActions(apprenticeId?: string) {
  const actions = await offlineDB.getAllOfflineActions();
  return actions.filter((action) => {
    if (action.type !== 'timeclock') return false;
    if (!apprenticeId) return true;
    try {
      const payload = JSON.parse(action.body || '{}') as QueuedTimeclockPayload;
      return payload.apprentice_id === apprenticeId;
    } catch {
      return false;
    }
  });
}

export async function requestTimeclockSync(): Promise<void> {
  await askWorkerToSync();
}
