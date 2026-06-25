/**
 * lib/memory-monitor.js
 * Proactive memory monitoring with heap tracking and restart triggers
 * 
 * Solves memory issues by:
 * 1. Tracking heap usage over time
 * 2. Warning at threshold (configurable)
 * 3. Forcing restart at critical threshold
 * 4. Attempting memory freeing actions
 */

const os = require('os');

// Memory thresholds (can be overridden via environment)
const THRESHOLDS = {
  // Warning: Start trying to free memory
  WARN_RATIO: parseFloat(process.env.MEMORY_WARN_RATIO || '0.75'),
  
  // Critical: Force restart to prevent OOM
  CRITICAL_RATIO: parseFloat(process.env.MEMORY_CRITICAL_RATIO || '0.85'),
  
  // Check interval in ms (default: every 30 seconds)
  CHECK_INTERVAL_MS: parseInt(process.env.MEMORY_CHECK_INTERVAL_MS || '30000'),
  
  // Number of samples to keep for trend analysis
  SAMPLE_HISTORY: 20,
  
  // Growth rate threshold: alert if heap grows > X% between checks
  GROWTH_RATE_WARN: 0.10, // 10% growth between checks is concerning
};

// Memory metrics tracking
const memoryMetrics = {
  samples: [], // Array of { timestamp, heapUsed, heapTotal, heapRatio }
  maxHeapUsed: 0,
  minHeapUsed: Infinity,
  restartsTriggered: 0,
  lastWarningTime: 0,
  lastCriticalTime: 0,
  monitoringInterval: null,
};

// References for cleanup
let gracefulShutdownFn = null;
let logFn = null;

/**
 * Get current memory stats
 */
function getMemoryStats() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const heapRatio = memUsage.heapUsed / memUsage.heapTotal;
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const externalMB = Math.round(memUsage.external / 1024 / 1024);
  
  return {
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

/**
 * Add a sample to the history
 */
function addSample() {
  const stats = getMemoryStats();
  const sample = {
    timestamp: Date.now(),
    ...stats,
  };
  
  memoryMetrics.samples.push(sample);
  
  // Keep only last N samples
  if (memoryMetrics.samples.length > THRESHOLDS.SAMPLE_HISTORY) {
    memoryMetrics.samples.shift();
  }
  
  // Update min/max
  memoryMetrics.maxHeapUsed = Math.max(memoryMetrics.maxHeapUsed, stats.heapUsed);
  memoryMetrics.minHeapUsed = Math.min(memoryMetrics.minHeapUsed, stats.heapUsed);
  
  return sample;
}

/**
 * Calculate memory growth rate between samples
 */
function getGrowthRate() {
  if (memoryMetrics.samples.length < 2) return 0;
  
  const recent = memoryMetrics.samples[memoryMetrics.samples.length - 1];
  const previous = memoryMetrics.samples[memoryMetrics.samples.length - 2];
  
  const bytesGrowth = recent.heapUsed - previous.heapUsed;
  const percentGrowth = bytesGrowth / previous.heapUsed;
  
  return percentGrowth;
}

/**
 * Attempt to free memory
 */
function attemptMemoryFree(reason) {
  const actions = [];
  
  // 1. Force GC if available
  if (typeof global.gc === 'function') {
    try {
      global.gc();
      actions.push('gc_forced');
    } catch (e) {
      // GC failed, continue
    }
  }
  
  // 2. Clear require cache for large modules (common memory hogs)
  const modulesToCheck = [
    'next/dist/server/web/sandbox-context',
    'next/dist/server/web/error-overlay/hot-reloader',
    // Add more modules as needed
  ];
  
  modulesToCheck.forEach(modName => {
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
  
  // 3. Hint to V8 to garbage collect (weakens external references)
  if (global.gc === undefined) {
    // If gc is not exposed, we can't force it, but we can hint
    // Create a large temporary object and let it go out of scope
    const temp = [];
    for (let i = 0; i < 1000; i++) {
      temp.push({ large: 'string'.repeat(1000) });
    }
    // temp goes out of scope immediately, hinting to GC
    actions.push('temp_allocation_hint');
  }
  
  // 4. Log the memory state before/after for debugging
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
  
  // Get after stats
  const after = getMemoryStats();
  const freedMB = before.heapUsedMB - after.heapUsedMB;
  
  if (logFn) {
    logFn('info', 'Memory free result', {
      event: 'memory_free_result',
      freedMB,
      heapAfterMB: after.heapUsedMB,
      heapRatioAfter: after.heapRatio,
    });
  }
  
  return { actions, before, after, freedMB };
}

/**
 * Check memory and take action based on thresholds
 */
function checkMemory() {
  const sample = addSample();
  const { heapRatio, heapUsedMB, heapTotalMB } = sample;
  
  const now = Date.now();
  
  // Check for rapid growth
  const growthRate = getGrowthRate();
  if (growthRate > THRESHOLDS.GROWTH_RATE_WARN) {
    if (logFn) {
      logFn('warn', 'Rapid memory growth detected', {
        event: 'memory_growth_warning',
        growthRatePercent: Math.round(growthRate * 100),
        heapUsedMB,
        heapRatio,
      });
    }
  }
  
  // Critical threshold - force restart
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
    
    // Stop monitoring and trigger shutdown
    stopMonitoring();
    
    if (gracefulShutdownFn) {
      gracefulShutdownFn('MEMORY_CRITICAL');
    }
    
    return { action: 'restart', reason: 'critical_threshold' };
  }
  
  // Warning threshold - try to free memory
  if (heapRatio >= THRESHOLDS.WARN_RATIO) {
    // Only log warning once per minute to avoid spam
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
    
    // Try to free memory
    attemptMemoryFree('threshold_warning');
    
    return { action: 'free_attempted', reason: 'warning_threshold' };
  }
  
  return { action: 'ok', heapRatio };
}

/**
 * Start memory monitoring
 */
function startMonitoring(shutdownFn, log) {
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
  
  // Initial check
  addSample();
  
  // Start periodic monitoring
  memoryMetrics.monitoringInterval = setInterval(() => {
    try {
      checkMemory();
    } catch (err) {
      if (logFn) {
        logFn('error', 'Memory check failed', {
          event: 'memory_check_error',
          error: err.message,
        });
      }
    }
  }, THRESHOLDS.CHECK_INTERVAL_MS);
  
  // Make interval non-blocking
  memoryMetrics.monitoringInterval.unref();
  
  return memoryMetrics;
}

/**
 * Stop memory monitoring
 */
function stopMonitoring() {
  if (memoryMetrics.monitoringInterval) {
    clearInterval(memoryMetrics.monitoringInterval);
    memoryMetrics.monitoringInterval = null;
  }
}

/**
 * Get current memory metrics
 */
function getMetrics() {
  return {
    ...memoryMetrics,
    current: memoryMetrics.samples[memoryMetrics.samples.length - 1] || null,
    thresholds: { ...THRESHOLDS },
  };
}

/**
 * Force a memory check (for testing/debugging)
 */
function forceCheck() {
  return checkMemory();
}

/**
 * Get heap trend analysis
 */
function getTrend() {
  if (memoryMetrics.samples.length < 3) {
    return { trend: 'unknown', samplesNeeded: 3 - memoryMetrics.samples.length };
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

module.exports = {
  startMonitoring,
  stopMonitoring,
  getMetrics,
  getStats: getMemoryStats,
  forceCheck,
  getTrend,
  attemptMemoryFree,
  THRESHOLDS,
};
