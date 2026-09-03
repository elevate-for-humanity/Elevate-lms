/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

/*
  Copyright (c) 2025 Elevate for Humanity
  Commercial License. No resale, sublicensing, or redistribution allowed.
  See LICENSE file for details.
*/

import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';

class EFHNotificationSystem {
  constructor() {
    this.notificationSettings = {
      email: process.env.NOTIFICATION_EMAIL || '',
      phone: '3177607908',
      enabledNotifications: {
        newSale: true,
        dailySummary: true,
        viewMilestones: true,
        systemAlerts: true,
        phoneAlerts: true,
      },
      milestones: {
        views: [100, 500, 1000, 5000],
        revenue: [1000, 5000, 10000, 25000],
      },
    };

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Initialize Twilio for SMS notifications
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const twilio = require('twilio');
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    this.revenueData = {
      daily: { revenue: 0, enrollments: 0, sales: 0 },
      weekly: { revenue: 0, enrollments: 0, sales: 0 },
      monthly: { revenue: 0, enrollments: 0, sales: 0 },
      marketplace: {
        cloudflarePages: { revenue: 0, views: 0, sales: 0 },
        flippa: { revenue: 0, views: 0, sales: 0 },
        bizbuysell: { revenue: 0, views: 0, sales: 0 },
        gumroad: { revenue: 0, views: 0, sales: 0 },
        github: { revenue: 0, views: 0, sales: 0 },
      },
    };

    this.initializeTracking();
  }

  initializeTracking() {
    // Load existing data if available
    try {
      const dataPath = path.join(__dirname, 'revenue-data.json');
      if (fs.existsSync(dataPath)) {
        this.revenueData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      }
    } catch (error) {
    }

    // Set up daily summary email
    this.scheduleDailySummary();
  }

  async trackSale(platform, amount, programName, studentInfo = {}) {
    const saleData = {
      timestamp: new Date().toISOString(),
      platform,
      amount: parseFloat(amount),
      program: programName,
      student: studentInfo,
      id: this.generateSaleId(),
    };

    // Update revenue tracking
    this.revenueData.daily.revenue += saleData.amount;
    this.revenueData.daily.sales += 1;
    this.revenueData.monthly.revenue += saleData.amount;
    this.revenueData.monthly.sales += 1;

    if (this.revenueData.marketplace[platform]) {
      this.revenueData.marketplace[platform].revenue += saleData.amount;
      this.revenueData.marketplace[platform].sales += 1;
    }

    // Save data
    this.saveRevenueData();

    // Send notification
    if (this.notificationSettings.enabledNotifications.newSale) {
      await this.sendSaleNotification(saleData);
    }

    // Send instant alert for any sale
    await this.sendInstantAlert(
      'SALE',
      `New $${saleData.amount} sale via ${platform}`,
      {
        amount: saleData.amount,
        platform: platform,
        details: `${programName} - ${studentInfo.name || 'Student'}`,
      }
    );

    // Check milestones
    await this.checkRevenueMilestones();

    return saleData.id;
  }

  async trackEnrollment(platform, programName, studentInfo, amount = 0) {
    const enrollmentData = {
      timestamp: new Date().toISOString(),
      platform,
      program: programName,
      student: studentInfo,
      amount: parseFloat(amount),
      id: this.generateEnrollmentId(),
    };

    // Update tracking
    this.revenueData.daily.enrollments += 1;
    this.revenueData.monthly.enrollments += 1;

    if (amount > 0) {
      await this.trackSale(platform, amount, programName, studentInfo);
    }

    this.saveRevenueData();
    return enrollmentData.id;
  }

  async trackMarketplaceView(platform, listingTitle) {
    if (this.revenueData.marketplace[platform]) {
      this.revenueData.marketplace[platform].views += 1;
      this.saveRevenueData();

      // Send instant SMS for every 10 views
      if (this.revenueData.marketplace[platform].views % 10 === 0) {
        await this.sendSMSNotification(
          `📈 ${platform}: ${this.revenueData.marketplace[platform].views} views! Keep it up!`
        );
      }

      // Check view milestones
      await this.checkViewMilestones(platform);
    }
  }

  async trackLicenseSale(platform, licenseType, amount, buyerInfo = {}) {
    const licenseData = {
      timestamp: new Date().toISOString(),
      platform,
      licenseType,
      amount: parseFloat(amount),
      buyer: buyerInfo,
      id: this.generateLicenseId(),
    };

    // Update tracking
    this.revenueData.daily.revenue += licenseData.amount;
    this.revenueData.daily.sales += 1;
    this.revenueData.monthly.revenue += licenseData.amount;
    this.revenueData.monthly.sales += 1;

    if (this.revenueData.marketplace[platform]) {
      this.revenueData.marketplace[platform].revenue += licenseData.amount;
      this.revenueData.marketplace[platform].sales += 1;
    }

    this.saveRevenueData();

    // Send notification
    if (this.notificationSettings.enabledNotifications.newSale) {
      await this.sendLicenseSaleNotification(licenseData);
    }

    return licenseData.id;
  }

  async sendSaleNotification(saleData) {
    // Send email notification
    if (this.notificationSettings.email) {
      await this.sendSaleEmailNotification(saleData);
    }

    // Send SMS notification
    if (
      this.notificationSettings.enabledNotifications.phoneAlerts &&
      this.notificationSettings.phone
    ) {
      await this.sendSMSNotification(
        `🎉 NEW SALE! $${saleData.amount} - ${saleData.program} via ${saleData.platform}. Daily total: $${this.revenueData.daily.revenue}`
      );
    }
  }

  async sendSaleEmailNotification(saleData) {
    if (!this.notificationSettings.email) return;

    const subject = `💰 New EFH Sale: $${saleData.amount} - ${saleData.program}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🎉 New Sale Alert!</h1>
        </div>

        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Sale Details</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>💰 Amount:</strong> $${saleData.amount.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>📚 Program:</strong> ${saleData.program}</p>
            <p style="margin: 5px 0;"><strong>🏪 Platform:</strong> ${saleData.platform}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${new Date(saleData.timestamp).toLocaleString()}</p>
          </div>

          <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Today's Performance</h3>
            <p style="margin: 5px 0;">💵 Daily Revenue: $${this.revenueData.daily.revenue.toLocaleString()}</p>
            <p style="margin: 5px 0;">🛒 Daily Sales: ${this.revenueData.daily.sales}</p>
            <p style="margin: 5px 0;">👥 Daily Enrollments: ${this.revenueData.daily.enrollments}</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; padding: 15px; background: white; border-radius: 10px;">
          <p style="color: #666; margin: 0;">Revenue Tracking Dashboard: <a href="${process.env.DASHBOARD_URL || 'http://localhost:5000'}/revenue-tracking-dashboard.html" style="color: #667eea;">View Live Stats</a></p>
        </div>
      </div>
    `;

    await this.sendEmail(subject, html);
  }

  async sendLicenseSaleNotification(licenseData) {
    if (!this.notificationSettings.email) return;

    const subject = `🎯 EFH License Sale: $${licenseData.amount} - ${licenseData.licenseType}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🚀 License Sale!</h1>
        </div>

        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">License Sale Details</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p style="margin: 5px 0;"><strong>💰 Amount:</strong> $${licenseData.amount.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>📦 License Type:</strong> ${licenseData.licenseType}</p>
            <p style="margin: 5px 0;"><strong>🏪 Platform:</strong> ${licenseData.platform}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${new Date(licenseData.timestamp).toLocaleString()}</p>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">Next Steps</h3>
            <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li>Prepare license package and documentation</li>
              <li>Schedule onboarding call with buyer</li>
              <li>Send access credentials and support information</li>
              <li>Update license tracking spreadsheet</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(subject, html);
  }

  async sendDailySummary() {
    if (
      !this.notificationSettings.email ||
      !this.notificationSettings.enabledNotifications.dailySummary
    )
      return;

    const subject = `📊 EFH Daily Summary - $${this.revenueData.daily.revenue.toLocaleString()} Revenue`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">📊 Daily Performance Summary</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;">
          <h2 style="color: #333; margin-bottom: 15px;">Today's Performance</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; text-align: center;">
              <h3 style="color: #28a745; margin: 0 0 10px 0;">💰 Revenue</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">$${this.revenueData.daily.revenue.toLocaleString()}</p>
            </div>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center;">
              <h3 style="color: #1976d2; margin: 0 0 10px 0;">🛒 Sales</h3>
              <p style="font-size: 24px; font-weight: bold; margin: 0; color: #333;">${this.revenueData.daily.sales}</p>
            </div>
          </div>
        </div>

        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 15px;">Marketplace Performance</h2>
          ${this.generateMarketplaceHtml()}
        </div>
      </div>
    `;

    await this.sendEmail(subject, html);

    // Reset daily counters
    this.revenueData.daily = { revenue: 0, enrollments: 0, sales: 0 };
    this.saveRevenueData();
  }

  generateMarketplaceHtml() {
    let html = '';
    Object.entries(this.revenueData.marketplace).forEach(([platform, data]) => {
      html += `
        <div style="background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; text-transform: capitalize;">${platform}</span>
          <div style="text-align: right;">
            <div style="color: #28a745; font-weight: bold;">$${data.revenue.toLocaleString()}</div>
            <div style="color: #666; font-size: 12px;">${data.views} views | ${data.sales} sales</div>
          </div>
        </div>
      `;
    });
    return html;
  }

  async checkRevenueMilestones() {
    const currentRevenue = this.revenueData.monthly.revenue;

    for (const milestone of this.notificationSettings.milestones.revenue) {
      if (
        currentRevenue >= milestone &&
        !this.hasReachedMilestone('revenue', milestone)
      ) {
        await this.sendMilestoneNotification(
          'revenue',
          milestone,
          currentRevenue
        );
        this.markMilestoneReached('revenue', milestone);
      }
    }
  }

  async checkViewMilestones(platform) {
    const currentViews = this.revenueData.marketplace[platform]?.views || 0;

    for (const milestone of this.notificationSettings.milestones.views) {
      if (
        currentViews >= milestone &&
        !this.hasReachedMilestone(`${platform}_views`, milestone)
      ) {
        await this.sendMilestoneNotification(
          'views',
          milestone,
          currentViews,
          platform
        );
        this.markMilestoneReached(`${platform}_views`, milestone);
      }
    }
  }

  async sendMilestoneNotification(type, milestone, current, platform = '') {
    if (
      !this.notificationSettings.email ||
      !this.notificationSettings.enabledNotifications.viewMilestones
    )
      return;

    const isViews = type === 'views';
    const subject = `🎯 Milestone Reached: ${milestone.toLocaleString()} ${type.toUpperCase()}${platform ? ` on ${platform}` : ''}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🎉 Milestone Achievement!</h1>
        </div>

        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">
            ${isViews ? '👁️' : '💰'} ${milestone.toLocaleString()} ${type.toUpperCase()} Reached!
          </h2>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; text-align: center;">
            <p style="font-size: 18px; margin: 0; color: #856404;">
              Current: ${current.toLocaleString()} ${type}${platform ? ` on ${platform}` : ''}
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail(subject, html);
  }

  hasReachedMilestone(type, milestone) {
    if (!this.revenueData.milestones) {
      this.revenueData.milestones = {};
    }
    return this.revenueData.milestones[`${type}_${milestone}`] || false;
  }

  markMilestoneReached(type, milestone) {
    if (!this.revenueData.milestones) {
      this.revenueData.milestones = {};
    }
    this.revenueData.milestones[`${type}_${milestone}`] = true;
    this.saveRevenueData();
  }

  scheduleDailySummary() {
    // Send daily summary at 8 PM
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(20, 0, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilScheduled = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.sendDailySummary();
      // Schedule for next day
      setInterval(() => this.sendDailySummary(), 24 * 60 * 60 * 1000);
    }, timeUntilScheduled);
  }

  async sendEmail(subject, html) {
    try {
      await this.transporter.sendMail({
        from: `"EFH Revenue Tracker" <${process.env.EMAIL_USER}>`,
        to: this.notificationSettings.email,
        subject,
        html,
      });
    } catch (error) {
    }
  }

  saveRevenueData() {
    try {
      const dataPath = path.join(__dirname, 'revenue-data.json');
      fs.writeFileSync(dataPath, JSON.stringify(this.revenueData, null, 2));
    } catch (error) {
    }
  }

  generateSaleId() {
    return `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEnrollmentId() {
    return `enrollment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateLicenseId() {
    return `license_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendSMSNotification(message) {
    if (!this.twilioClient) {
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+1${this.notificationSettings.phone}`,
      });
        `📱 SMS sent to ${this.notificationSettings.phone}: ${message.substring(0, 50)}...`
      );
    } catch (error) {
      // Fallback: log to console for debugging
    }
  }

  async sendInstantAlert(type, message, data = {}) {
    const alertMessage = `🚨 ${type.toUpperCase()}: ${message}`;

    // Always send SMS for instant alerts
    if (this.notificationSettings.phone) {
      await this.sendSMSNotification(alertMessage);
    }

    // Also send email for high priority alerts
    if (
      this.notificationSettings.email &&
      ['SALE', 'ERROR', 'MILESTONE'].includes(type)
    ) {
      await this.sendEmail(
        `🚨 EFH Alert: ${type}`,
        `
        <div style="font-family: Arial, sans-serif; background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; border-radius: 5px;">
          <h2 style="color: #856404; margin: 0 0 10px 0;">${alertMessage}</h2>
          <div style="color: #856404;">
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            ${data.amount ? `<p><strong>Amount:</strong> $${data.amount}</p>` : ''}
            ${data.platform ? `<p><strong>Platform:</strong> ${data.platform}</p>` : ''}
            ${data.details ? `<p><strong>Details:</strong> ${data.details}</p>` : ''}
          </div>
        </div>
      `
      );
    }
  }

  // API endpoints for tracking
  setupExpressRoutes(app) {
    app.post('/api/track/sale', async (req, res) => {
      try {
        const { platform, amount, program, student } = req.body;
        const saleId = await this.trackSale(platform, amount, program, student);
        res.json({ success: true, saleId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/track/enrollment', async (req, res) => {
      try {
        const { platform, program, student, amount } = req.body;
        const enrollmentId = await this.trackEnrollment(
          platform,
          program,
          student,
          amount
        );
        res.json({ success: true, enrollmentId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/track/view', async (req, res) => {
      try {
        const { platform, listing } = req.body;
        await this.trackMarketplaceView(platform, listing);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/track/license', async (req, res) => {
      try {
        const { platform, licenseType, amount, buyer } = req.body;
        const licenseId = await this.trackLicenseSale(
          platform,
          licenseType,
          amount,
          buyer
        );
        res.json({ success: true, licenseId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.get('/api/revenue/data', (req, res) => {
      res.json(this.revenueData);
    });

    app.post('/api/notifications/settings', (req, res) => {
      try {
        this.notificationSettings = {
          ...this.notificationSettings,
          ...req.body,
        };
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/test-sms', async (req, res) => {
      try {
        await this.sendSMSNotification(
          '🧪 Test SMS from EFH - Phone alerts are working!'
        );
        res.json({ success: true, message: 'Test SMS sent!' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}

module.exports = EFHNotificationSystem;
