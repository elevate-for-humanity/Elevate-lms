// Urgency and Scarcity System for Flash Sales
class UrgencyScarcityManager {
  constructor() {
    this.inventory = {
      emergency_starter: { total: 50, sold: 0, reserved: 0 },
      business_rescue: { total: 25, sold: 0, reserved: 0 },
      enterprise_emergency: { total: 10, sold: 0, reserved: 0 },
    };

    this.reservations = new Map(); // Track temporary reservations
    this.saleMetrics = {
      startTime: new Date(),
      totalViews: 0,
      uniqueVisitors: new Set(),
      conversions: 0,
      abandonedCarts: 0,
    };

    this.urgencyMessages = [
      '🚨 Personal financial emergency - must sell immediately',
      '⚠️ Bank foreclosure notice received - liquidating assets',
      '💔 Medical bills forcing immediate sale',
      '🏠 Risk of losing home - need cash now',
      '⏰ 48 hours to raise funds or lose everything',
    ];

    this.scarcityTriggers = {
      lowStock: 5,
      veryLowStock: 2,
      lastChance: 1,
    };
  }

  // Get current inventory status
  getInventoryStatus(packageId) {
    const item = this.inventory[packageId];
    if (!item) return null;

    const available = item.total - item.sold - item.reserved;
    const percentSold = Math.round((item.sold / item.total) * 100);

    let urgencyLevel = 'normal';
    let message = '';

    if (available <= this.scarcityTriggers.lastChance) {
      urgencyLevel = 'critical';
      message = `🔥 LAST ${available} REMAINING!`;
    } else if (available <= this.scarcityTriggers.veryLowStock) {
      urgencyLevel = 'high';
      message = `⚠️ Only ${available} left at this price!`;
    } else if (available <= this.scarcityTriggers.lowStock) {
      urgencyLevel = 'medium';
      message = `🏃‍♂️ ${available} remaining - selling fast!`;
    }

    return {
      available,
      total: item.total,
      sold: item.sold,
      percentSold,
      urgencyLevel,
      message,
      isLowStock: available <= this.scarcityTriggers.lowStock,
    };
  }

  // Reserve inventory temporarily (for checkout process)
  reserveInventory(packageId, sessionId, minutes = 15) {
    const item = this.inventory[packageId];
    if (!item) return { success: false, reason: 'Invalid package' };

    const available = item.total - item.sold - item.reserved;
    if (available <= 0) {
      return { success: false, reason: 'Out of stock' };
    }

    // Clear expired reservations first
    this.clearExpiredReservations();

    // Create new reservation
    const reservation = {
      packageId,
      sessionId,
      expiresAt: new Date(Date.now() + minutes * 60 * 1000),
      createdAt: new Date(),
    };

    this.reservations.set(sessionId, reservation);
    item.reserved++;

    return {
      success: true,
      expiresAt: reservation.expiresAt,
      remainingTime: minutes * 60,
    };
  }

  // Complete purchase (convert reservation to sale)
  completePurchase(sessionId) {
    const reservation = this.reservations.get(sessionId);
    if (!reservation) {
      return { success: false, reason: 'No reservation found' };
    }

    const item = this.inventory[reservation.packageId];
    if (!item) {
      return { success: false, reason: 'Invalid package' };
    }

    // Convert reservation to sale
    item.reserved--;
    item.sold++;
    this.reservations.delete(sessionId);
    this.saleMetrics.conversions++;

    return {
      success: true,
      packageId: reservation.packageId,
      newInventoryStatus: this.getInventoryStatus(reservation.packageId),
    };
  }

  // Cancel reservation (abandoned cart)
  cancelReservation(sessionId) {
    const reservation = this.reservations.get(sessionId);
    if (reservation) {
      const item = this.inventory[reservation.packageId];
      if (item) {
        item.reserved--;
      }
      this.reservations.delete(sessionId);
      this.saleMetrics.abandonedCarts++;
    }
  }

  // Clear expired reservations
  clearExpiredReservations() {
    const now = new Date();
    for (const [sessionId, reservation] of this.reservations.entries()) {
      if (now > reservation.expiresAt) {
        const item = this.inventory[reservation.packageId];
        if (item) {
          item.reserved--;
        }
        this.reservations.delete(sessionId);
        this.saleMetrics.abandonedCarts++;
      }
    }
  }

  // Get random urgency message
  getUrgencyMessage() {
    return this.urgencyMessages[Math.floor(Math.random() * this.urgencyMessages.length)];
  }

  // Get time-based urgency
  getTimeUrgency() {
    const now = new Date();
    const saleStart = this.saleMetrics.startTime;
    const hoursElapsed = (now - saleStart) / (1000 * 60 * 60);

    if (hoursElapsed < 6) {
      return {
        level: 'high',
        message: '🔥 Flash sale just started - best prices available now!',
        timeLeft: '48 hours',
      };
    } else if (hoursElapsed < 24) {
      return {
        level: 'medium',
        message: '⏰ Less than 24 hours left at these emergency prices!',
        timeLeft: Math.round(48 - hoursElapsed) + ' hours',
      };
    } else if (hoursElapsed < 42) {
      return {
        level: 'high',
        message: '🚨 Final hours - prices go back to normal soon!',
        timeLeft: Math.round(48 - hoursElapsed) + ' hours',
      };
    } else {
      return {
        level: 'critical',
        message: '⚠️ LAST CHANCE - Sale ends in minutes!',
        timeLeft: 'Minutes remaining',
      };
    }
  }

  // Track visitor activity
  trackVisitor(visitorId, action, packageId = null) {
    this.saleMetrics.totalViews++;
    this.saleMetrics.uniqueVisitors.add(visitorId);

    // Return social proof data
    const uniqueVisitorCount = this.saleMetrics.uniqueVisitors.size;
    const conversionRate = (this.saleMetrics.conversions / this.saleMetrics.totalViews) * 100;

    return {
      socialProof: {
        visitorsToday: uniqueVisitorCount,
        totalViews: this.saleMetrics.totalViews,
        conversionRate: Math.round(conversionRate * 10) / 10,
        recentActivity: this.getRecentActivity(),
      },
    };
  }

  // Generate recent activity for social proof
  getRecentActivity() {
    const activities = [
      'Someone from California just purchased Business Rescue',
      'Enterprise Emergency package sold to Texas buyer',
      'New York customer downloaded Starter package',
      'Florida business owner bought Business Rescue',
      'Someone from Washington just reserved Enterprise Emergency',
      'Starter package purchased by Illinois customer',
      'Business Rescue reserved by Arizona buyer',
    ];

    return activities[Math.floor(Math.random() * activities.length)];
  }

  // Get comprehensive urgency data for frontend
  getUrgencyData(packageId, visitorId) {
    this.clearExpiredReservations();

    const inventory = this.getInventoryStatus(packageId);
    const timeUrgency = this.getTimeUrgency();
    const socialProof = this.trackVisitor(visitorId, 'view', packageId);
    const urgencyMessage = this.getUrgencyMessage();

    return {
      inventory,
      timeUrgency,
      socialProof: socialProof.socialProof,
      urgencyMessage,
      scarcityElements: {
        showLowStock: inventory?.isLowStock || false,
        showTimer: true,
        showSocialProof: true,
        showUrgencyMessage: true,
      },
      recommendations: this.getRecommendations(packageId),
    };
  }

  // Get upgrade recommendations based on scarcity
  getRecommendations(packageId) {
    const recommendations = [];

    // If starter is low stock, recommend business
    if (packageId === 'emergency_starter') {
      const starterStatus = this.getInventoryStatus('emergency_starter');
      const businessStatus = this.getInventoryStatus('business_rescue');

      if (starterStatus?.isLowStock && businessStatus?.available > 5) {
        recommendations.push({
          type: 'upgrade',
          message: '🚀 Starter running low - Business Rescue still available!',
          targetPackage: 'business_rescue',
          savings: 'Only $500 more for 3x the features',
        });
      }
    }

    // If business is low stock, recommend enterprise
    if (packageId === 'business_rescue') {
      const businessStatus = this.getInventoryStatus('business_rescue');
      const enterpriseStatus = this.getInventoryStatus('enterprise_emergency');

      if (businessStatus?.isLowStock && enterpriseStatus?.available > 2) {
        recommendations.push({
          type: 'upgrade',
          message: '💎 Business Rescue selling out - Enterprise still available!',
          targetPackage: 'enterprise_emergency',
          savings: 'Unlimited licenses + revenue sharing',
        });
      }
    }

    return recommendations;
  }

  // Get sales dashboard data
  getSalesDashboard() {
    this.clearExpiredReservations();

    const totalSold = Object.values(this.inventory).reduce((sum, item) => sum + item.sold, 0);
    const totalRevenue =
      this.inventory.emergency_starter.sold * 299 +
      this.inventory.business_rescue.sold * 799 +
      this.inventory.enterprise_emergency.sold * 1999;

    return {
      totalSold,
      totalRevenue,
      conversionRate: ((this.saleMetrics.conversions / this.saleMetrics.totalViews) * 100).toFixed(
        2,
      ),
      uniqueVisitors: this.saleMetrics.uniqueVisitors.size,
      abandonmentRate: (
        (this.saleMetrics.abandonedCarts /
          (this.saleMetrics.abandonedCarts + this.saleMetrics.conversions)) *
        100
      ).toFixed(2),
      inventory: this.inventory,
      activeReservations: this.reservations.size,
      saleProgress: {
        hoursElapsed: Math.round((new Date() - this.saleMetrics.startTime) / (1000 * 60 * 60)),
        timeRemaining: Math.max(
          0,
          48 - Math.round((new Date() - this.saleMetrics.startTime) / (1000 * 60 * 60)),
        ),
      },
    };
  }
}

// Global instance
const urgencyManager = new UrgencyScarcityManager();

module.exports = {
  UrgencyScarcityManager,
  urgencyManager,
};
