import { generateLicense, validateLicense } from './license-generator.js';
import generateLicensePDF from './generate-certificate.js';

// License Tier Definitions
const LICENSE_TIERS = {
  starter: {
    name: 'Starter License',
    maxDeployments: 1,
    features: ['basic_lms', 'payment_integration', 'workbooks_access', 'email_support'],
    restrictions: {
      whiteLabel: false,
      governmentCompliance: false,
      analytics: 'basic',
      support: 'email_only',
    },
    downloadLimits: {
      maxDownloads: 10,
      concurrentUsers: 50,
    },
  },

  business: {
    name: 'Business License',
    maxDeployments: 3,
    features: [
      'complete_lms',
      'payment_integration',
      'workbooks_access',
      'government_compliance',
      'white_label',
      'analytics_dashboard',
      'priority_support',
    ],
    restrictions: {
      whiteLabel: true,
      governmentCompliance: true,
      analytics: 'advanced',
      support: 'priority_email_chat',
    },
    downloadLimits: {
      maxDownloads: 50,
      concurrentUsers: 500,
    },
  },

  enterprise: {
    name: 'Enterprise License',
    maxDeployments: -1, // Unlimited
    features: [
      'full_ecosystem',
      'payment_integration',
      'workbooks_access',
      'government_compliance',
      'white_label',
      'analytics_dashboard',
      'wioa_templates',
      'contract_assistance',
      'white_glove_support',
      'revenue_sharing',
      'unlimited_licenses',
    ],
    restrictions: {
      whiteLabel: true,
      governmentCompliance: true,
      analytics: 'enterprise',
      support: 'white_glove_24_7',
    },
    downloadLimits: {
      maxDownloads: -1, // Unlimited
      concurrentUsers: -1, // Unlimited
    },
  },
};

// Enhanced License Generator with Tier Support
function generateTieredLicense(email, packageId, licenseType, expiresInDays = 365) {
  const tier = LICENSE_TIERS[licenseType];
  if (!tier) {
    throw new Error(`Invalid license type: ${licenseType}`);
  }

  // Generate base license
  const { licenseKey, expiresAt } = generateLicense(email, packageId, expiresInDays);

  // Create enhanced license object with tier information
  const enhancedLicense = {
    licenseKey,
    expiresAt,
    tier: licenseType,
    tierName: tier.name,
    features: tier.features,
    restrictions: tier.restrictions,
    downloadLimits: tier.downloadLimits,
    maxDeployments: tier.maxDeployments,
    issuedAt: new Date(),
    customerEmail: email,
    packageId: packageId,
  };

  return enhancedLicense;
}

// License Validation with Feature Checking
function validateTieredLicense(licenseKey, requestedFeature = null) {
  const baseValidation = validateLicense(licenseKey);

  if (!baseValidation.valid) {
    return baseValidation;
  }

  // Extract tier information from product ID
  const tierType = extractTierFromProductId(baseValidation.productId);
  const tier = LICENSE_TIERS[tierType];

  if (!tier) {
    return { valid: false, reason: 'Invalid license tier' };
  }

  const enhancedValidation = {
    ...baseValidation,
    tier: tierType,
    tierName: tier.name,
    features: tier.features,
    restrictions: tier.restrictions,
    downloadLimits: tier.downloadLimits,
    maxDeployments: tier.maxDeployments,
  };

  // Check specific feature access if requested
  if (requestedFeature) {
    enhancedValidation.hasFeature = tier.features.includes(requestedFeature);
    if (!enhancedValidation.hasFeature) {
      enhancedValidation.featureError = `Feature '${requestedFeature}' not available in ${tier.name}`;
    }
  }

  return enhancedValidation;
}

// Extract tier from product ID
function extractTierFromProductId(productId) {
  if (productId.includes('emergency_starter')) return 'starter';
  if (productId.includes('business_rescue')) return 'business';
  if (productId.includes('enterprise_emergency')) return 'enterprise';

  // Default mappings
  if (productId.includes('starter') || productId.includes('basic')) return 'starter';
  if (productId.includes('business') || productId.includes('professional')) return 'business';
  if (productId.includes('enterprise') || productId.includes('unlimited')) return 'enterprise';

  return 'starter'; // Default fallback
}

// Usage Tracking for License Limits
class LicenseUsageTracker {
  constructor() {
    this.usageData = new Map();
  }

  trackDownload(licenseKey, fileType, userIP) {
    const validation = validateTieredLicense(licenseKey);
    if (!validation.valid) {
      return { allowed: false, reason: validation.reason };
    }

    const usage = this.getUsage(licenseKey);
    const limits = validation.downloadLimits;

    // Check download limits
    if (limits.maxDownloads !== -1 && usage.downloads >= limits.maxDownloads) {
      return { allowed: false, reason: 'Download limit exceeded' };
    }

    // Track the download
    usage.downloads++;
    usage.lastDownload = new Date();
    usage.downloadHistory.push({
      timestamp: new Date(),
      fileType,
      userIP,
    });

    this.usageData.set(licenseKey, usage);

    return {
      allowed: true,
      remainingDownloads:
        limits.maxDownloads === -1 ? 'unlimited' : limits.maxDownloads - usage.downloads,
    };
  }

  trackDeployment(licenseKey, domain) {
    const validation = validateTieredLicense(licenseKey);
    if (!validation.valid) {
      return { allowed: false, reason: validation.reason };
    }

    const usage = this.getUsage(licenseKey);
    const maxDeployments = validation.maxDeployments;

    // Check deployment limits
    if (maxDeployments !== -1 && usage.deployments.length >= maxDeployments) {
      return { allowed: false, reason: 'Deployment limit exceeded' };
    }

    // Check if domain already deployed
    if (usage.deployments.includes(domain)) {
      return { allowed: true, reason: 'Domain already registered' };
    }

    // Track the deployment
    usage.deployments.push(domain);
    usage.lastDeployment = new Date();

    this.usageData.set(licenseKey, usage);

    return {
      allowed: true,
      remainingDeployments:
        maxDeployments === -1 ? 'unlimited' : maxDeployments - usage.deployments.length,
    };
  }

  getUsage(licenseKey) {
    if (!this.usageData.has(licenseKey)) {
      this.usageData.set(licenseKey, {
        downloads: 0,
        deployments: [],
        downloadHistory: [],
        createdAt: new Date(),
        lastDownload: null,
        lastDeployment: null,
      });
    }
    return this.usageData.get(licenseKey);
  }

  getUsageStats(licenseKey) {
    const validation = validateTieredLicense(licenseKey);
    if (!validation.valid) {
      return { error: validation.reason };
    }

    const usage = this.getUsage(licenseKey);
    const limits = validation.downloadLimits;

    return {
      tier: validation.tierName,
      downloads: {
        used: usage.downloads,
        limit: limits.maxDownloads === -1 ? 'unlimited' : limits.maxDownloads,
        remaining: limits.maxDownloads === -1 ? 'unlimited' : limits.maxDownloads - usage.downloads,
      },
      deployments: {
        used: usage.deployments.length,
        limit: validation.maxDeployments === -1 ? 'unlimited' : validation.maxDeployments,
        remaining:
          validation.maxDeployments === -1
            ? 'unlimited'
            : validation.maxDeployments - usage.deployments.length,
        domains: usage.deployments,
      },
      features: validation.features,
      restrictions: validation.restrictions,
      lastActivity: {
        lastDownload: usage.lastDownload,
        lastDeployment: usage.lastDeployment,
      },
    };
  }
}

// Global usage tracker instance
const usageTracker = new LicenseUsageTracker();

// Feature Access Control
function checkFeatureAccess(licenseKey, feature) {
  const validation = validateTieredLicense(licenseKey, feature);

  if (!validation.valid) {
    return {
      access: false,
      reason: validation.reason,
      upgradeRequired: false,
    };
  }

  if (!validation.hasFeature) {
    return {
      access: false,
      reason: validation.featureError,
      upgradeRequired: true,
      currentTier: validation.tierName,
      requiredTier: getRequiredTierForFeature(feature),
    };
  }

  return {
    access: true,
    tier: validation.tierName,
    features: validation.features,
  };
}

function getRequiredTierForFeature(feature) {
  for (const [tierName, tier] of Object.entries(LICENSE_TIERS)) {
    if (tier.features.includes(feature)) {
      return tier.name;
    }
  }
  return 'Enterprise License';
}

export {
  generateTieredLicense,
  validateTieredLicense,
  checkFeatureAccess,
  usageTracker,
  LICENSE_TIERS,
};
