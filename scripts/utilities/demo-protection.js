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

// Demo Mode Protection for EFH Sister Sites
const DEMO_CONFIG = require('./config/demo-config.json');

class DemoProtection {
  static isDemoMode() {
    return process.env.EFH_DEMO_MODE === 'true' || DEMO_CONFIG.demo_mode;
  }

  static checkFeatureAccess(feature) {
    if (!this.isDemoMode()) return true;
    return !DEMO_CONFIG.restricted_features.includes(feature);
  }

  static getDemoPrograms() {
    if (!this.isDemoMode()) return null;
    return DEMO_CONFIG.demo_programs;
  }

  static addDemoWatermark(html) {
    if (!this.isDemoMode()) return html;

    const watermark = `
      <div style="position: fixed; top: 10px; right: 10px; background: rgba(255,0,0,0.8);
                  color: white; padding: 8px; border-radius: 4px; z-index: 9999; font-size: 12px;">
        ${DEMO_CONFIG.watermark}
      </div>
    `;

    return html.replace('</body>', watermark + '</body>');
  }

  static restrictPayments() {
    if (!this.isDemoMode()) return false;

    return {
      error: 'Demo Mode: Contact licensing@elevateforhumanity.org for full access',
      demo_contact: DEMO_CONFIG.contact_info,
    };
  }
}

module.exports = DemoProtection;
