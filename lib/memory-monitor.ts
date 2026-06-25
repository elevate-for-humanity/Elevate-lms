/**
 * lib/memory-monitor.ts
 * Proactive memory monitoring with heap tracking and restart triggers
 *
 * Solves memory issues by:
 * 1. Tracking heap usage over time
 * 2. Warning at threshold (configurable)
 * 3. Forcing restart at critical threshold
 * 4. Attempting memory freeing actions
 */

import os from 'os';

type LogFn = (level: 'info' | 'warn' | 'error', msg: string, ctx?: Record<string, unknown>) => void;
type ShutdownFn = (reason: string) => void;

// Memory thresholds (can be overridden via environment)
const THRESHOLDS = {
  WARN_RATIO: parseFloat(process.env.MEMORY_WARN_RATIO || '0.75'),
  CRITICAL_RATIO: parseFloat(process.env.MEMORY_CRITICAL_RATIO || '0.85'),
  CHECK_INTERVAL_MS: parseInt(process.env.MEMORY_CHECK_INTERVAL_MS || '30000', 10),
  SAMPLE_HISTORY: 20,
  GROWTH_RATE_WARN: 0.10,
};

interface MemorySample {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  heapUsedMB: number;
  heapTotalMB: number;
  heapRatio: number;
  rssMB: number;
  externalMB: number;
  systemFree: number;
  systemFreeMB: number;
  systemTotal: number;
  systemTotalMB: number;
}

interface MemoryMetrics {
  samples: MemorySample[];
  maxHeapUsed: number;
  minHeapUsed: number;
  restartsTriggered: number;
  lastWarningTime: number;
  lastCriticalTime: number;
  monitoringInterval: NodeJS.Timeout | null;
}

// Memory metrics tracking
const memoryMetrics: MemoryMetrics = {
  samples: [],
  maxHeapUsed: 0,
  minHeapUsed: Infinity,
  restartsTriggered: 0,
  lastWarningTime: 0,
  lastCriticalTime: 0,
  monitoringInterval: null,
};

let gracefulShutdownFn: ShutdownFn | null = null;
let logFn: LogFn | null = null;

function getMemoryStats(): MemorySample {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapRatio = memUsage.heapUsed / memUsage.heapTotal;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const externalMB = Math.round(memUsage.external / 1024 / 1024);

  return {
    timestamp: Date.now(),
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    heapUsedMB,
    heapTotalMB,
    heapRatio: Math.round(heapRatio * 100) / 100,
    rssMB,
    externalMB,
    systemFree: os.freemem(),
    systemFreeMB: Math.round(os.freemem() / 1024 / 1024),
    systemTotal: os.totalmem(),
    systemTotalMB: Math.round(os.totalmem() / 1024 / 1024),
  };
}

function addSample(): MemorySample {
  const stats = getMemoryStats();
  memoryMetrics.samples.push(stats);

  if (memoryMetrics.samples.length > THRESHOLDS.SAMPLE_HISTORY) {
    memoryMetrics.samples.shift();
  }

  memoryMetrics.maxHeapUsed = Math.max(memoryMetrics.maxHeapUsed, stats.heapUsed);
  memoryMetrics.minHeapUsed = Math.min(memoryMetrics.minHeapUsed, stats.heapUsed);

  return stats;
}

function getGrowthRate(): number {
  if (memoryMetrics.samples.length < 2) return 0;
  const recent = memoryMetrics.samples[memoryMetrics.samples.length - 1];
  const previous = memoryMetrics.samples[memoryMetrics.samples.length - 2];
  const bytesGrowth = recent.heapUsed - previous.heapUsed;
  return bytesGrowth / previous.heapUsed;
}

function attemptMemoryFree(reason: string): { actions: string[]; freedMB: number } {
  const actions: string[] = [];

  if (typeof global.gc === 'function') {
    try {
      global.gc();
      actions.push('gc_forced');
    } catch {
      // GC failed
    }
  }

  const modulesToCheck = [
    'next/dist/server/web/sandbox-context',
    'next/dist/server/web/error-overlay/hot-reloader',
  ];

  modulesToCheck.forEach((modName) => {
    try {
      const resolved = require.resolve(modName);
      if (require.cache[resolved]) {
        delete require.cache[resolved];
        actions.push(`cache_cleared:${modName.split('/').pop()}`);
      }
    } catch {
      // Module not loaded
    }
  });

  if (global.gc === undefined) {
    const temp: unknown[] = [];
    for (let i = 0; i < 1000; i++) {
      temp.push({ large: 'string'.repeat(1000) });
    }
    actions.push('temp_allocation_hint');
  }

  const before = getMemoryStats();

  if (logFn) {
    logFn('warn', 'Memory free attempt', {
      event: 'memory_free_attempt',
      reason,
      actions,
      heapBeforeMB: before.heapUsedMB,
      heapRatioBefore: before.heapRatio,
    });
  }

  const after = getMemoryStats();
  const freedMB = before.heapUsedMB - after.heapUsedMB;

  return { actions, freedMB };
}

function checkMemory(): { action: string; reason?: string } {
  const sample = addSample();
  const { heapRatio, heapUsedMB, heapTotalMB } = sample;
  const now = Date.now();

  const growthRate = getGrowthRate();
  if (growthRate > THRESHOLDS.GROWTH_RATE_WARN && logFn) {
    logFn('warn', 'Rapid memory growth detected', {
      event: 'memory_growth_warning',
      growthRatePercent: Math.round(growthRate * 100),
      heapUsedMB,
      heapRatio,
    });
  }

  if (heapRatio >= THRESHOLDS.CRITICAL_RATIO) {
    memoryMetrics.lastCriticalTime = now;
    memoryMetrics.restartsTriggered++;

    if (logFn) {
      logFn('error', 'MEMORY CRITICAL - Initiating restart', {
        event: 'memory_critical',
        heapUsedMB,
        heapTotalMB,
        heapRatio,
        restartsTriggered: memoryMetrics.restartsTriggered,
        threshold: THRESHOLDS.CRITICAL_RATIO,
      });
    }

    stopMonitoring();
    if (gracefulShutdownFn) {
      gracefulShutdownFn('MEMORY_CRITICAL');
    }

    return { action: 'restart', reason: 'critical_threshold' };
  }

  if (heapRatio >= THRESHOLDS.WARN_RATIO) {
    if (now - memoryMetrics.lastWarningTime > 60_000) {
      memoryMetrics.lastWarningTime = now;

      if (logFn) {
        logFn('warn', 'Memory warning - attempting to free', {
          event: 'memory_warning',
          heapUsedMB,
          heapTotalMB,
          heapRatio,
          threshold: THRESHOLDS.WARN_RATIO,
          maxHeapMB: Math.round(memoryMetrics.maxHeapUsed / 1024 / 1024),
        });
      }
    }

    attemptMemoryFree('threshold_warning');
    return { action: 'free_attempted', reason: 'warning_threshold' };
  }

  return { action: 'ok' };
}

export function startMonitoring(shutdownFn: ShutdownFn, log: LogFn): MemoryMetrics {
  gracefulShutdownFn = shutdownFn;
  logFn = log;

  if (logFn) {
    logFn('info', 'Memory monitoring started', {
      event: 'memory_monitor_start',
      warnThreshold: THRESHOLDS.WARN_RATIO,
      criticalThreshold: THRESHOLDS.CRITICAL_RATIO,
      checkIntervalMs: THRESHOLDS.CHECK_INTERVAL_MS,
    });
  }

  addSample();

  memoryMetrics.monitoringInterval = setInterval(() => {
    try {
      checkMemory();
    } catch (err) {
      if (logFn) {
        logFn('error', 'Memory check failed', {
          event: 'memory_check_error',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }, THRESHOLDS.CHECK_INTERVAL_MS);

  if (memoryMetrics.monitoringInterval.unref) {
    memoryMetrics.monitoringInterval.unref();
  }

  return memoryMetrics;
}

export function stopMonitoring(): void {
  if (memoryMetrics.monitoringInterval) {
    clearInterval(memoryMetrics.monitoringInterval);
    memoryMetrics.monitoringInterval = null;
  }
}

export function getMetrics(): MemoryMetrics & { current: MemorySample | null } {
  return {
    ...memoryMetrics,
    current: memoryMetrics.samples[memoryMetrics.samples.length - 1] || null,
  };
}

export function getStats(): MemorySample {
  return getMemoryStats();
}

export function forceCheck(): ReturnType<typeof checkMemory> {
  return checkMemory();
}

export function getTrend(): { trend: string; changePercent: number; samples: number; avgHeapUsedMB: number } {
  if (memoryMetrics.samples.length < 3) {
    return { trend: 'unknown', changePercent: 0, samples: memoryMetrics.samples.length, avgHeapUsedMB: 0 };
  }

  const recent = memoryMetrics.samples.slice(-5);
  const first = recent[0].heapUsed;
  const last = recent[recent.length - 1].heapUsed;
  const changePercent = ((last - first) / first) * 100;

  let trend = 'stable';
  if (changePercent > 10) trend = 'increasing';
  if (changePercent < -10) trend = 'decreasing';

  return {
    trend,
    changePercent: Math.round(changePercent * 100) / 100,
    samples: recent.length,
    avgHeapUsedMB: Math.round(recent.reduce((sum, s) => sum + s.heapUsedMB, 0) / recent.length),
  };
}

export { THRESHOLDS };
