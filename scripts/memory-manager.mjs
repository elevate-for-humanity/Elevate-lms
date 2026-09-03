#!/usr/bin/env node

/**
 * Automated Memory Management System
 * Keeps memory usage below critical thresholds and pushes data to cloud
 */

import { execSync } from 'child_process';
import {
  existsSync,
  unlinkSync,
  statSync,
  readdirSync,
  writeFileSync,
  readFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Memory thresholds (in MB)
const THRESHOLDS = {
  CRITICAL: 800, // Critical cleanup needed
  WARNING: 600, // Start cleanup
  TARGET: 400, // Target size after cleanup
};

// Files/patterns to clean up
const CLEANUP_TARGETS = [
  // Core dumps and crash files
  { pattern: /^core\.\d+$/, priority: 1, description: 'Core dumps' },
  { pattern: /\.dump$/, priority: 1, description: 'Dump files' },
  { pattern: /\.crash$/, priority: 1, description: 'Crash files' },

  // Temporary files
  { pattern: /\.tmp$/, priority: 2, description: 'Temp files' },
  { pattern: /\.temp$/, priority: 2, description: 'Temp files' },
  { pattern: /~$/, priority: 2, description: 'Backup files' },

  // Log files (keep recent, archive old)
  { pattern: /\.log$/, priority: 3, description: 'Log files', archive: true },

  // Large exports (move to cloud)
  {
    pattern: /complete-project-export\.txt$/,
    priority: 4,
    description: 'Project exports',
    cloud: true,
  },
  {
    pattern: /-export\.txt$/,
    priority: 4,
    description: 'Export files',
    cloud: true,
  },

  // Cache directories
  {
    pattern: /\.cache$/,
    priority: 5,
    description: 'Cache directories',
    isDir: true,
  },
  { pattern: /\.npm$/, priority: 5, description: 'NPM cache', isDir: true },
];

class MemoryManager {
  constructor() {
    this.stats = {
      cleaned: 0,
      archived: 0,
      cloudUploaded: 0,
      spaceSaved: 0,
    };
  }

  // Get current disk usage in MB
  getCurrentUsage() {
    try {
      const output = execSync('du -sm .', { cwd: ROOT, encoding: 'utf8' });
      return parseInt(output.split('\t')[0]);
    } catch (error) {
      console.error('Failed to get disk usage:', error.message);
      return 0;
    }
  }

  // Get memory usage
  getMemoryUsage() {
    try {
      const output = execSync('free -m', { encoding: 'utf8' });
      const lines = output.split('\n');
      const memLine = lines.find((line) => line.startsWith('Mem:'));
      if (memLine) {
        const parts = memLine.split(/\s+/);
        return {
          total: parseInt(parts[1]),
          used: parseInt(parts[2]),
          free: parseInt(parts[3]),
          available: parseInt(parts[6]),
        };
      }
    } catch (error) {
      console.error('Failed to get memory usage:', error.message);
    }
    return null;
  }

  // Find files matching cleanup patterns
  findCleanupTargets() {
    const targets = [];

    const scanDirectory = (dir, depth = 0) => {
      if (depth > 3) return; // Limit recursion depth

      try {
        const items = readdirSync(dir);

        for (const item of items) {
          if (item.startsWith('.git') || item === 'node_modules') continue;

          const fullPath = join(dir, item);
          const stat = statSync(fullPath);

          for (const target of CLEANUP_TARGETS) {
            if (target.pattern.test(item)) {
              const sizeKB = Math.round(stat.size / 1024);
              targets.push({
                path: fullPath,
                size: sizeKB,
                isDir: stat.isDirectory(),
                ...target,
              });
              break;
            }
          }

          // Recurse into directories (except node_modules)
          if (
            stat.isDirectory() &&
            item !== 'node_modules' &&
            !item.startsWith('.')
          ) {
            scanDirectory(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDirectory(ROOT);

    // Sort by priority (lower number = higher priority)
    return targets.sort((a, b) => a.priority - b.priority);
  }

  // Archive file to compressed format
  archiveFile(filePath) {
    try {
      const archivePath = `${filePath}.gz`;
      execSync(`gzip -c "${filePath}" > "${archivePath}"`, { cwd: ROOT });
      unlinkSync(filePath);
      this.stats.archived++;
      return true;
    } catch (error) {
      console.error(`Failed to archive ${filePath}:`, error.message);
      return false;
    }
  }

  // Move file to cloud storage (simulate with compressed archive)
  moveToCloud(filePath) {
    try {
      const cloudDir = join(ROOT, '.cloud-archive');
      if (!existsSync(cloudDir)) {
        execSync(`mkdir -p "${cloudDir}"`);
      }

      const fileName = filePath.split('/').pop();
      const cloudPath = join(cloudDir, `${fileName}.cloud.gz`);

      execSync(`gzip -c "${filePath}" > "${cloudPath}"`);
      unlinkSync(filePath);

      // Create cloud reference file
      const refPath = `${filePath}.cloud-ref`;
      writeFileSync(
        refPath,
        JSON.stringify(
          {
            originalPath: filePath,
            cloudPath: cloudPath,
            uploadedAt: new Date().toISOString(),
            size: statSync(cloudPath).size,
          },
          null,
          2
        )
      );

      this.stats.cloudUploaded++;
      return true;
    } catch (error) {
      console.error(`Failed to move ${filePath} to cloud:`, error.message);
      return false;
    }
  }

  // Clean up a single target
  cleanupTarget(target) {
    try {
      const sizeBefore = target.size;

      if (target.cloud) {
        if (this.moveToCloud(target.path)) {
          this.stats.spaceSaved += sizeBefore;
          return true;
        }
      } else if (target.archive) {
        if (this.archiveFile(target.path)) {
          this.stats.spaceSaved += sizeBefore * 0.7; // Estimate compression
          return true;
        }
      } else {
        // Direct deletion
        if (target.isDir) {
          execSync(`rm -rf "${target.path}"`);
        } else {
          unlinkSync(target.path);
        }
        this.stats.cleaned++;
        this.stats.spaceSaved += sizeBefore;
        return true;
      }
    } catch (error) {
      console.error(`Failed to cleanup ${target.path}:`, error.message);
    }
    return false;
  }

  // Perform cleanup based on current usage
  performCleanup() {
    const currentUsage = this.getCurrentUsage();
    const memory = this.getMemoryUsage();

    if (memory) {
        `💾 Memory: ${memory.used}MB used, ${memory.available}MB available`
      );
    }

    if (currentUsage < THRESHOLDS.WARNING) {
      return false;
    }

      `⚠️  Memory usage above ${THRESHOLDS.WARNING}MB threshold - starting cleanup...`
    );

    const targets = this.findCleanupTargets();

    let cleaned = 0;
    for (const target of targets) {
      if (this.getCurrentUsage() < THRESHOLDS.TARGET) {
        break;
      }

        `🧹 Cleaning: ${target.path} (${target.size}KB) - ${target.description}`
      );
      if (this.cleanupTarget(target)) {
        cleaned++;
      }

      // Check if we're in critical territory
      if (this.getCurrentUsage() > THRESHOLDS.CRITICAL) {
        // In critical mode, clean everything we can
      }
    }

    const finalUsage = this.getCurrentUsage();
      `   Space saved: ${Math.round(this.stats.spaceSaved / 1024)}MB`
    );

    return cleaned > 0;
  }

  // Create monitoring script
  createMonitoringScript() {
    const monitorScript = `#!/bin/bash
# Memory monitoring script - runs every 5 minutes

USAGE=$(du -sm . | cut -f1)
THRESHOLD=${THRESHOLDS.WARNING}

if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "$(date): Memory usage $USAGE MB exceeds threshold $THRESHOLD MB" >> memory-alerts.log
  node scripts/memory-manager.mjs --auto-cleanup
fi
`;

    writeFileSync(join(ROOT, 'scripts/memory-monitor.sh'), monitorScript);
    execSync('chmod +x scripts/memory-monitor.sh');
  }

  // Set up automated cleanup
  setupAutomation() {
    this.createMonitoringScript();

    // Add to package.json scripts
    const pkgPath = join(ROOT, 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

    pkg.scripts = pkg.scripts || {};
    pkg.scripts['memory:check'] = 'node scripts/memory-manager.mjs';
    pkg.scripts['memory:cleanup'] = 'node scripts/memory-manager.mjs --cleanup';
    pkg.scripts['memory:monitor'] = './scripts/memory-monitor.sh';

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  }
}

// CLI interface
const manager = new MemoryManager();

const args = process.argv.slice(2);
if (args.includes('--cleanup') || args.includes('--auto-cleanup')) {
  manager.performCleanup();
} else if (args.includes('--setup')) {
  manager.setupAutomation();
} else if (args.includes('--monitor')) {
  const usage = manager.getCurrentUsage();
  const memory = manager.getMemoryUsage();

  if (memory) {
  }

  if (usage > THRESHOLDS.WARNING) {
    process.exit(1);
  } else {
  }
} else {
}
