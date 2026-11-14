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

/**
 * EFH System Monitor & Tracking Dashboard
 * Real-time monitoring with email notifications
 */

const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EFHMonitor {
  constructor() {
    this.metrics = {
      pageViews: {},
      userActivity: {},
      enrollments: {},
      payments: {},
      errors: [],
      performance: {},
      systemHealth: {
        uptime: Date.now(),
        memory: 0,
        cpu: 0,
        activeUsers: 0,
      },
    };

    this.alerts = {
      highErrorRate: false,
      lowPerformance: false,
      paymentFailures: false,
      serverDown: false,
    };

    this.setupEmailTransporter();
    this.startMonitoring();
  }

  setupEmailTransporter() {
    this.emailTransporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.MONITOR_EMAIL || 'your-email@gmail.com',
        pass: process.env.MONITOR_EMAIL_PASSWORD || 'your-app-password',
      },
    });
  }

  // Track page views across all sister sites
  trackPageView(req) {
    const page = req.path;
    const timestamp = new Date().toISOString();
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || 'Unknown';

    if (!this.metrics.pageViews[page]) {
      this.metrics.pageViews[page] = [];
    }

    this.metrics.pageViews[page].push({
      timestamp,
      userAgent,
      ip,
      referrer: req.get('Referrer') || 'Direct',
    });

    // Keep only last 1000 views per page
    if (this.metrics.pageViews[page].length > 1000) {
      this.metrics.pageViews[page] = this.metrics.pageViews[page].slice(-1000);
    }

  }

  // Track user enrollments
  trackEnrollment(courseId, userId, paymentMethod, amount) {
    const enrollment = {
      courseId,
      userId,
      paymentMethod,
      amount,
      timestamp: new Date().toISOString(),
    };

    if (!this.metrics.enrollments[courseId]) {
      this.metrics.enrollments[courseId] = [];
    }

    this.metrics.enrollments[courseId].push(enrollment);

      `🎓 New Enrollment: Course ${courseId} | User: ${userId} | Amount: $${amount}`
    );

    // Send enrollment notification
    this.sendNotification('enrollment', {
      subject: `New Enrollment - Course ${courseId}`,
      message: `User ${userId} enrolled in course ${courseId} for $${amount} via ${paymentMethod}`,
      data: enrollment,
    });
  }

  // Track payment transactions
  trackPayment(transactionId, amount, status, method, courseId) {
    const payment = {
      transactionId,
      amount,
      status,
      method,
      courseId,
      timestamp: new Date().toISOString(),
    };

    if (!this.metrics.payments[status]) {
      this.metrics.payments[status] = [];
    }

    this.metrics.payments[status].push(payment);

      `💳 Payment ${status}: ${transactionId} | $${amount} | ${method}`
    );

    // Alert on payment failures
    if (status === 'failed') {
      this.sendAlert('payment_failure', {
        subject: 'Payment Failure Alert',
        message: `Payment failed: ${transactionId} for $${amount}`,
        data: payment,
      });
    }
  }

  // Track errors and exceptions
  trackError(error, context = {}) {
    const errorLog = {
      message: error.message || error,
      stack: error.stack || 'No stack trace',
      context,
      timestamp: new Date().toISOString(),
    };

    this.metrics.errors.push(errorLog);

    // Keep only last 500 errors
    if (this.metrics.errors.length > 500) {
      this.metrics.errors = this.metrics.errors.slice(-500);
    }


    // Alert on high error rate
    const recentErrors = this.metrics.errors.filter(
      (err) => Date.now() - new Date(err.timestamp).getTime() < 300000 // Last 5 minutes
    );

    if (recentErrors.length > 10 && !this.alerts.highErrorRate) {
      this.alerts.highErrorRate = true;
      this.sendAlert('high_error_rate', {
        subject: 'High Error Rate Alert',
        message: `${recentErrors.length} errors in the last 5 minutes`,
        data: recentErrors,
      });

      // Reset alert after 10 minutes
      setTimeout(() => {
        this.alerts.highErrorRate = false;
      }, 600000);
    }
  }

  // Track system performance
  trackPerformance(metric, value, context = {}) {
    if (!this.metrics.performance[metric]) {
      this.metrics.performance[metric] = [];
    }

    this.metrics.performance[metric].push({
      value,
      context,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 100 measurements per metric
    if (this.metrics.performance[metric].length > 100) {
      this.metrics.performance[metric] =
        this.metrics.performance[metric].slice(-100);
    }

    // Alert on poor performance
    if (
      metric === 'response_time' &&
      value > 5000 &&
      !this.alerts.lowPerformance
    ) {
      this.alerts.lowPerformance = true;
      this.sendAlert('low_performance', {
        subject: 'Performance Alert',
        message: `Slow response time: ${value}ms`,
        data: { metric, value, context },
      });

      setTimeout(() => {
        this.alerts.lowPerformance = false;
      }, 300000);
    }
  }

  // Send email notifications
  async sendNotification(type, { subject, message, data }) {
    const emailContent = `
        <h2>EFH System Notification</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        `;

    try {
      await this.emailTransporter.sendMail({
        from: process.env.MONITOR_EMAIL,
        to: process.env.ADMIN_EMAIL || 'admin@elevateforhumanity.org',
        subject: `[EFH] ${subject}`,
        html: emailContent,
      });

    } catch (error) {
    }
  }

  // Send critical alerts
  async sendAlert(type, { subject, message, data }) {
    const emailContent = `
        <h2 style="color: red;">🚨 EFH SYSTEM ALERT 🚨</h2>
        <p><strong>Alert Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Action Required:</strong> Please check the system immediately</p>
        <hr>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        `;

    try {
      await this.emailTransporter.sendMail({
        from: process.env.MONITOR_EMAIL,
        to: process.env.ADMIN_EMAIL || 'admin@elevateforhumanity.org',
        subject: `🚨 [EFH ALERT] ${subject}`,
        html: emailContent,
        priority: 'high',
      });

    } catch (error) {
    }
  }

  // Start system monitoring
  startMonitoring() {
    // Monitor system health every minute
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.metrics.systemHealth.memory = Math.round(
        memUsage.heapUsed / 1024 / 1024
      );
      this.metrics.systemHealth.uptime =
        Date.now() - this.metrics.systemHealth.uptime;

        `🔍 System Health: Memory: ${this.metrics.systemHealth.memory}MB | Uptime: ${Math.round(this.metrics.systemHealth.uptime / 1000 / 60)}min`
      );
    }, 60000);

    // Send daily summary email
    setInterval(
      () => {
        this.sendDailySummary();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours
  }

  // Send daily summary
  async sendDailySummary() {
    const today = new Date().toDateString();
    const todayViews = Object.values(this.metrics.pageViews)
      .flat()
      .filter((view) => new Date(view.timestamp).toDateString() === today);

    const todayEnrollments = Object.values(this.metrics.enrollments)
      .flat()
      .filter(
        (enrollment) => new Date(enrollment.timestamp).toDateString() === today
      );

    const todayPayments = Object.values(this.metrics.payments)
      .flat()
      .filter(
        (payment) => new Date(payment.timestamp).toDateString() === today
      );

    const todayErrors = this.metrics.errors.filter(
      (error) => new Date(error.timestamp).toDateString() === today
    );

    const summary = `
        <h2>📊 EFH Daily Summary - ${today}</h2>

        <h3>📈 Traffic</h3>
        <ul>
            <li>Total Page Views: ${todayViews.length}</li>
            <li>Unique Pages Visited: ${Object.keys(this.metrics.pageViews).length}</li>
        </ul>

        <h3>🎓 Enrollments</h3>
        <ul>
            <li>New Enrollments: ${todayEnrollments.length}</li>
            <li>Total Revenue: $${todayEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)}</li>
        </ul>

        <h3>💳 Payments</h3>
        <ul>
            <li>Successful Payments: ${todayPayments.filter((p) => p.status === 'succeeded').length}</li>
            <li>Failed Payments: ${todayPayments.filter((p) => p.status === 'failed').length}</li>
            <li>Total Payment Volume: $${todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0)}</li>
        </ul>

        <h3>⚠️ System Health</h3>
        <ul>
            <li>Errors Today: ${todayErrors.length}</li>
            <li>Current Memory Usage: ${this.metrics.systemHealth.memory}MB</li>
            <li>Uptime: ${Math.round(this.metrics.systemHealth.uptime / 1000 / 60 / 60)}h</li>
        </ul>
        `;

    await this.sendNotification('daily_summary', {
      subject: `Daily Summary - ${today}`,
      message: 'Your daily EFH system summary',
      data: summary,
    });
  }

  // Get current metrics for dashboard
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        totalPageViews: Object.values(this.metrics.pageViews).flat().length,
        totalEnrollments: Object.values(this.metrics.enrollments).flat().length,
        totalPayments: Object.values(this.metrics.payments).flat().length,
        totalErrors: this.metrics.errors.length,
        systemHealth: this.metrics.systemHealth,
      },
    };
  }

  // Express middleware for automatic tracking
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Track page view
      this.trackPageView(req);

      // Track response time
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.trackPerformance('response_time', responseTime, {
          path: req.path,
          method: req.method,
          status: res.statusCode,
        });
      });

      next();
    };
  }
}

module.exports = EFHMonitor;
