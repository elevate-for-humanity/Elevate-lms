import { logger } from '@/lib/logger';
/**
 * IRS Update Alert System
 * Sends notifications when tax parameter changes are detected
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ChangeDetection, TaxParameterUpdate, AlertConfig, Alert } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Re-export types
export type { AlertConfig, Alert };

/**
 * Alert Manager
 */
export class AlertManager {
  private config: AlertConfig;
  private alertsFile: string;
  private alerts: Alert[] = [];
  
  constructor(config: AlertConfig) {
    this.config = config;
    this.alertsFile = path.join(__dirname, '../.cache/alerts.json');
    this.loadAlerts();
  }
  
  /**
   * Load existing alerts
   */
  private loadAlerts(): void {
    try {
      if (fs.existsSync(this.alertsFile)) {
        this.alerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf-8'));
      }
    } catch (error) {
      this.alerts = [];
    }
  }
  
  /**
   * Save alerts
   */
  private saveAlerts(): void {
    const dir = path.dirname(this.alertsFile);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.alertsFile, JSON.stringify(this.alerts, null, 2));
  }
  
  /**
   * Generate unique alert ID
   */
  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  /**
   * Create alert from change detection
   */
  async createAlertFromChange(change: ChangeDetection): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      type: 'change_detected',
      severity: 'warning',
      title: `IRS Content Change Detected: ${change.source}`,
      message: `The IRS website content at ${change.url} has changed. Previous hash: ${change.previousHash}, New hash: ${change.currentHash}. Review required to determine if tax parameters need updating.`,
      source: change.source,
      sourceUrl: change.url,
      detectedAt: change.timestamp,
      acknowledged: false,
      data: {
        previousHash: change.previousHash,
        currentHash: change.currentHash
      }
    };
    
    this.alerts.push(alert);
    this.saveAlerts();
    
    // Send notifications
    await this.sendNotifications(alert);
    
    return alert;
  }
  
  /**
   * Create alert from parameter update
   */
  async createAlertFromUpdate(update: TaxParameterUpdate): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      type: 'update_available',
      severity: update.confidence === 'high' ? 'critical' : 'warning',
      title: `Tax Parameter Update: ${update.parameter}`,
      message: `New value detected for ${update.parameter} (Tax Year ${update.taxYear}): ${JSON.stringify(update.newValue)}. Source: ${update.source}. Confidence: ${update.confidence}.`,
      source: update.source,
      sourceUrl: update.sourceUrl,
      detectedAt: update.detectedAt,
      acknowledged: false,
      data: {
        taxYear: update.taxYear,
        parameter: update.parameter,
        oldValue: update.oldValue,
        newValue: update.newValue,
        confidence: update.confidence
      }
    };
    
    this.alerts.push(alert);
    this.saveAlerts();
    
    // Send notifications
    await this.sendNotifications(alert);
    
    return alert;
  }
  
  /**
   * Send notifications through all configured channels
   */
  async sendNotifications(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];
    
    if (this.config.webhook?.enabled) {
      promises.push(this.sendWebhook(alert));
    }
    
    if (this.config.email?.enabled) {
      promises.push(this.sendEmail(alert));
    }
    
    if (this.config.sms?.enabled) {
      promises.push(this.sendSMS(alert));
    }
    
    if (this.config.inApp?.enabled) {
      promises.push(this.saveToDatabase(alert));
    }
    
    await Promise.allSettled(promises);
  }
  
  /**
   * Send webhook notification (Slack, Discord, etc.)
   */
  private async sendWebhook(alert: Alert): Promise<void> {
    if (!this.config.webhook?.url) return;
    
    let payload: any;
    
    if (this.config.webhook.type === 'slack') {
      payload = {
        text: alert.title,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: alert.title }
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: alert.message }
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `*Source:* ${alert.source}` },
              { type: 'mrkdwn', text: `*Severity:* ${alert.severity}` },
              { type: 'mrkdwn', text: `*Detected:* ${alert.detectedAt}` }
            ]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Source' },
                url: alert.sourceUrl
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Review in Admin' },
                url: 'https://elevateforhumanity.org/admin/tax-software/updates'
              }
            ]
          }
        ]
      };
    } else if (this.config.webhook.type === 'discord') {
      payload = {
        embeds: [{
          title: alert.title,
          description: alert.message,
          color: alert.severity === 'critical' ? 0xff0000 : alert.severity === 'warning' ? 0xffaa00 : 0x00ff00,
          fields: [
            { name: 'Source', value: alert.source, inline: true },
            { name: 'Severity', value: alert.severity, inline: true },
            { name: 'Detected', value: alert.detectedAt, inline: true }
          ],
          url: alert.sourceUrl
        }]
      };
    } else {
      payload = alert;
    }
    
    try {
      await fetch(this.config.webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      logger.error('Failed to send webhook:', error);
    }
  }
  
  /**
   * Send email notification
   */
  private async sendEmail(alert: Alert): Promise<void> {
    // Email implementation would go here
    // Using nodemailer or similar
    logger.info(`[EMAIL] Would send to: ${this.config.email?.recipients.join(', ')}`);
    logger.info(`[EMAIL] Subject: ${alert.title}`);
  }
  
  /**
   * Send SMS notification
   */
  private async sendSMS(alert: Alert): Promise<void> {
    // SMS implementation would go here
    // Using Twilio or similar
    logger.info(`[SMS] Would send to: ${this.config.sms?.phoneNumbers.join(', ')}`);
    logger.info(`[SMS] Message: ${alert.title}`);
  }
  
  /**
   * Save alert to database
   */
  private async saveToDatabase(alert: Alert): Promise<void> {
    if (!this.config.inApp?.supabaseUrl || !this.config.inApp?.supabaseKey) {
      return;
    }
    
    try {
      const response = await fetch(`${this.config.inApp.supabaseUrl}/rest/v1/tax_update_alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.inApp.supabaseKey,
          'Authorization': `Bearer ${this.config.inApp.supabaseKey}`
        },
        body: JSON.stringify({
          alert_id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          source: alert.source,
          source_url: alert.sourceUrl,
          detected_at: alert.detectedAt,
          acknowledged: alert.acknowledged,
          data: alert.data
        })
      });
      
      if (!response.ok) {
        logger.error('Failed to save alert to database:', await response.text());
      }
    } catch (error) {
      logger.error('Failed to save alert to database:', error);
    }
  }
  
  /**
   * Get all unacknowledged alerts
   */
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }
  
  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts];
  }
  
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;
    
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;
    
    this.saveAlerts();
    return true;
  }
  
  /**
   * Clear old acknowledged alerts
   */
  clearOldAlerts(daysOld: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);
    
    const before = this.alerts.length;
    this.alerts = this.alerts.filter(a => {
      if (!a.acknowledged) return true;
      const ackDate = new Date(a.acknowledgedAt || a.detectedAt);
      return ackDate > cutoff;
    });
    
    this.saveAlerts();
    return before - this.alerts.length;
  }
}

/**
 * Create alert manager with config from environment
 */
export function createAlertManager(): AlertManager {
  const config: AlertConfig = {
    webhook: {
      enabled: !!process.env.IRS_MONITOR_WEBHOOK_URL,
      url: process.env.IRS_MONITOR_WEBHOOK_URL || '',
      type: (process.env.IRS_MONITOR_WEBHOOK_TYPE as 'slack' | 'discord' | 'generic') || 'slack'
    },
    email: {
      enabled: !!process.env.IRS_MONITOR_EMAIL_RECIPIENTS,
      recipients: (process.env.IRS_MONITOR_EMAIL_RECIPIENTS || '').split(',').filter(Boolean)
    },
    inApp: {
      enabled: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  };
  
  return new AlertManager(config);
}
