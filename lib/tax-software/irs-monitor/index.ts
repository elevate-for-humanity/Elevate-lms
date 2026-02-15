import { logger } from '@/lib/logger';
/**
 * IRS Monitor Service
 * Main entry point for automated tax parameter monitoring
 * 
 * Features:
 * - Scrapes IRS.gov for changes
 * - Parses tax parameters from content
 * - Generates config file updates
 * - Sends alerts for review
 * - Supports one-click approval
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { IRSScraper, createScraper, IRS_SOURCES } from './scraper';
import { AlertManager, createAlertManager } from './alerts';
import { loadTaxConfig } from '../config';
import type { 
  ChangeDetection, 
  TaxParameterUpdate, 
  Alert, 
  MonitorConfig, 
  PendingUpdate, 
  MonitorReport 
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export types
export type { ChangeDetection, TaxParameterUpdate, Alert, MonitorConfig, PendingUpdate, MonitorReport };

/**
 * IRS Monitor Service
 */
export class IRSMonitor {
  private config: MonitorConfig;
  private scraper: IRSScraper;
  private alertManager: AlertManager;
  private pendingUpdatesFile: string;
  private pendingUpdates: PendingUpdate[] = [];
  
  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = {
      taxYear: new Date().getFullYear() + 1, // Next tax year
      autoGenerateConfig: true,
      requireApproval: true,
      sources: Object.keys(IRS_SOURCES),
      ...config
    };
    
    this.scraper = createScraper();
    this.alertManager = createAlertManager();
    this.pendingUpdatesFile = path.join(__dirname, '../.cache/pending-updates.json');
    this.loadPendingUpdates();
  }
  
  /**
   * Load pending updates
   */
  private loadPendingUpdates(): void {
    try {
      if (fs.existsSync(this.pendingUpdatesFile)) {
        this.pendingUpdates = JSON.parse(fs.readFileSync(this.pendingUpdatesFile, 'utf-8'));
      }
    } catch (error) {
      this.pendingUpdates = [];
    }
  }
  
  /**
   * Save pending updates
   */
  private savePendingUpdates(): void {
    const dir = path.dirname(this.pendingUpdatesFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.pendingUpdatesFile, JSON.stringify(this.pendingUpdates, null, 2));
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  /**
   * Run full monitoring cycle
   */
  async run(): Promise<MonitorReport> {
    const runId = `run_${Date.now().toString(36)}`;
    const timestamp = new Date().toISOString();
    
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`IRS Monitor - Run ${runId}`);
    logger.info(`Timestamp: ${timestamp}`);
    logger.info(`Tax Year: ${this.config.taxYear}`);
    logger.info(`${'='.repeat(60)}\n`);
    
    const changes: ChangeDetection[] = [];
    const updates: TaxParameterUpdate[] = [];
    let alertsSent = 0;
    
    // Check each source
    for (const sourceKey of this.config.sources) {
      logger.info(`Checking ${sourceKey}...`);
      
      try {
        const change = await this.scraper.checkSource(sourceKey);
        changes.push(change);
        
        if (change.detected) {
          logger.info(`  ⚠️  Change detected!`);
          
          // Send alert
          await this.alertManager.createAlertFromChange(change);
          alertsSent++;
          
          // Parse for tax parameters
          const content = this.scraper.getCachedContent(sourceKey);
          if (content && sourceKey === 'revenueProcedures') {
            const parsed = this.scraper.parseRevenueProcedure(content, this.config.taxYear);
            updates.push(...parsed);
            
            // Create pending updates
            for (const update of parsed) {
              await this.createPendingUpdate(update);
              await this.alertManager.createAlertFromUpdate(update);
              alertsSent++;
            }
          }
        } else {
          logger.info(`  ✓ No changes`);
        }
      } catch (error) {
        logger.error(`  ✗ Error: ${error}`);
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    const report: MonitorReport = {
      runId,
      timestamp,
      sourcesChecked: this.config.sources.length,
      changesDetected: changes.filter(c => c.detected).length,
      updatesFound: updates.length,
      alertsSent,
      changes,
      updates
    };
    
    // Save report
    await this.saveReport(report);
    
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`Run Complete`);
    logger.info(`Sources checked: ${report.sourcesChecked}`);
    logger.info(`Changes detected: ${report.changesDetected}`);
    logger.info(`Updates found: ${report.updatesFound}`);
    logger.info(`Alerts sent: ${report.alertsSent}`);
    logger.info(`${'='.repeat(60)}\n`);
    
    return report;
  }
  
  /**
   * Create a pending update
   */
  private async createPendingUpdate(update: TaxParameterUpdate): Promise<PendingUpdate> {
    // Get current value from config
    let currentValue: any = null;
    try {
      const config = loadTaxConfig(update.taxYear);
      const parts = update.parameter.split('.');
      let value: any = config;
      for (const part of parts) {
        value = value?.[part];
      }
      currentValue = value;
    } catch (error) {
      // Config might not exist yet
    }
    
    const pending: PendingUpdate = {
      id: this.generateId(),
      taxYear: update.taxYear,
      parameter: update.parameter,
      currentValue,
      newValue: update.newValue,
      source: update.source,
      sourceUrl: update.sourceUrl,
      confidence: update.confidence,
      detectedAt: update.detectedAt,
      status: 'pending'
    };
    
    this.pendingUpdates.push(pending);
    this.savePendingUpdates();
    
    return pending;
  }
  
  /**
   * Get all pending updates
   */
  getPendingUpdates(): PendingUpdate[] {
    return this.pendingUpdates.filter(u => u.status === 'pending');
  }
  
  /**
   * Approve a pending update
   */
  async approveUpdate(updateId: string, approvedBy: string): Promise<boolean> {
    const update = this.pendingUpdates.find(u => u.id === updateId);
    if (!update || update.status !== 'pending') return false;
    
    update.status = 'approved';
    update.approvedBy = approvedBy;
    update.approvedAt = new Date().toISOString();
    
    this.savePendingUpdates();
    
    // Apply the update to config
    if (this.config.autoGenerateConfig) {
      await this.applyUpdateToConfig(update);
    }
    
    return true;
  }
  
  /**
   * Reject a pending update
   */
  rejectUpdate(updateId: string, rejectedBy: string): boolean {
    const update = this.pendingUpdates.find(u => u.id === updateId);
    if (!update || update.status !== 'pending') return false;
    
    update.status = 'rejected';
    update.approvedBy = rejectedBy;
    update.approvedAt = new Date().toISOString();
    
    this.savePendingUpdates();
    return true;
  }
  
  /**
   * Apply approved update to config file
   */
  private async applyUpdateToConfig(update: PendingUpdate): Promise<void> {
    const configPath = path.join(__dirname, `../config/${update.taxYear}.json`);
    
    let config: any;
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
      // Create new config based on previous year
      const prevYear = update.taxYear - 1;
      const prevConfigPath = path.join(__dirname, `../config/${prevYear}.json`);
      if (fs.existsSync(prevConfigPath)) {
        config = JSON.parse(fs.readFileSync(prevConfigPath, 'utf-8'));
        config.taxYear = update.taxYear;
        config.effectiveDate = `${update.taxYear}-01-01`;
      } else {
        logger.error(`Cannot create config for ${update.taxYear} - no previous year config found`);
        return;
      }
    }
    
    // Apply the update
    const parts = update.parameter.split('.');
    let target = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = update.newValue;
    
    // Update metadata
    config.lastUpdated = new Date().toISOString().split('T')[0];
    config.source = update.source;
    
    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info(`Updated config for ${update.taxYear}: ${update.parameter} = ${update.newValue}`);
  }
  
  /**
   * Save monitoring report
   */
  private async saveReport(report: MonitorReport): Promise<void> {
    const reportsDir = path.join(__dirname, '../.cache/reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    
    const reportFile = path.join(reportsDir, `${report.runId}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  }
  
  /**
   * Get unacknowledged alerts
   */
  getAlerts(): Alert[] {
    return this.alertManager.getUnacknowledgedAlerts();
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    return this.alertManager.acknowledgeAlert(alertId, acknowledgedBy);
  }
}

/**
 * Create monitor instance
 */
export function createMonitor(config?: Partial<MonitorConfig>): IRSMonitor {
  return new IRSMonitor(config);
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const taxYear = args.find(a => a.startsWith('--year='))?.split('=')[1];
  
  const monitor = createMonitor({
    taxYear: taxYear ? parseInt(taxYear) : undefined
  });
  
  await monitor.run();
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1]?.endsWith('index.ts');
if (isMainModule) {
  main().catch(console.error);
}
