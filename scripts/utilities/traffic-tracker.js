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

const fs = require('fs');
const path = require('path');

class TrafficTracker {
  constructor() {
    this.hits = new Map();
    this.salesLeads = [];
  }

  trackHit(req) {
    const hit = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      url: req.url,
      referrer: req.get('Referrer') || 'direct',
      method: req.method,
    };

    // Track by hour for analytics
    const hourKey = new Date().toISOString().substring(0, 13);
    if (!this.hits.has(hourKey)) {
      this.hits.set(hourKey, []);
    }
    this.hits.get(hourKey).push(hit);

    // Log high-value pages
    if (req.url.includes('/pay') || req.url.includes('emergency')) {
      this.salesLeads.push(hit);

      // Send SMS alert for payment page visits
      if (req.url.includes('/pay')) {
        this.sendSalesAlert(`🚨 PAYMENT PAGE VISIT: ${hit.ip} at ${hit.timestamp}`);
      }
    }

    // Save to file every 10 hits
    if (this.salesLeads.length % 10 === 0) {
      fs.writeFileSync('sales-leads.json', JSON.stringify(this.salesLeads, null, 2));
    }
  }

  sendSalesAlert(message) {
    // This would integrate with SMS system
  }

  getStats() {
    return {
      totalHits: Array.from(this.hits.values()).reduce((sum, arr) => sum + arr.length, 0),
      salesLeads: this.salesLeads.length,
      lastHour: this.hits.get(new Date().toISOString().substring(0, 13))?.length || 0,
    };
  }
}

module.exports = new TrafficTracker();
