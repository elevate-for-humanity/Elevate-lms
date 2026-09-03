const express = require('express');
const { urgencyManager } = require('./urgency-scarcity-system');
const app = express();

app.use(express.json());
app.use(express.static('.'));

// Get urgency data for a specific package
app.get('/api/urgency/:packageId', (req, res) => {
  try {
    const { packageId } = req.params;
    const visitorId = req.headers['x-visitor-id'] || req.ip;

    const urgencyData = urgencyManager.getUrgencyData(packageId, visitorId);
    res.json(urgencyData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get urgency data' });
  }
});

// Reserve inventory for checkout
app.post('/api/reserve-inventory', (req, res) => {
  try {
    const { packageId, sessionId } = req.body;

    if (!packageId || !sessionId) {
      return res.status(400).json({
        error: 'Package ID and session ID are required',
      });
    }

    const result = urgencyManager.reserveInventory(packageId, sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reserve inventory' });
  }
});

// Complete purchase
app.post('/api/complete-purchase', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const result = urgencyManager.completePurchase(sessionId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// Cancel reservation (abandoned cart)
app.post('/api/cancel-reservation', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    urgencyManager.cancelReservation(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
});

// Get sales dashboard (admin only)
app.get('/api/sales-dashboard', (req, res) => {
  try {
    // In production, add authentication here
    const dashboard = urgencyManager.getSalesDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sales dashboard' });
  }
});

// Get live inventory status
app.get('/api/inventory-status', (req, res) => {
  try {
    const status = {
      emergency_starter: urgencyManager.getInventoryStatus('emergency_starter'),
      business_rescue: urgencyManager.getInventoryStatus('business_rescue'),
      enterprise_emergency: urgencyManager.getInventoryStatus('enterprise_emergency'),
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get inventory status' });
  }
});

// Track visitor action
app.post('/api/track-action', (req, res) => {
  try {
    const { action, packageId } = req.body;
    const visitorId = req.headers['x-visitor-id'] || req.ip;

    const result = urgencyManager.trackVisitor(visitorId, action, packageId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track action' });
  }
});

// Get real-time social proof
app.get('/api/social-proof', (req, res) => {
  try {
    const visitorId = req.headers['x-visitor-id'] || req.ip;
    const result = urgencyManager.trackVisitor(visitorId, 'social_proof_view');

    res.json({
      recentActivity: urgencyManager.getRecentActivity(),
      ...result.socialProof,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get social proof' });
  }
});

// WebSocket for real-time updates (optional)
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Real-time inventory updates
io.on('connection', (socket) => {
  // Send initial inventory status
  socket.emit('inventory-update', {
    emergency_starter: urgencyManager.getInventoryStatus('emergency_starter'),
    business_rescue: urgencyManager.getInventoryStatus('business_rescue'),
    enterprise_emergency: urgencyManager.getInventoryStatus('enterprise_emergency'),
  });

  // Send periodic updates
  const updateInterval = setInterval(() => {
    socket.emit('inventory-update', {
      emergency_starter: urgencyManager.getInventoryStatus('emergency_starter'),
      business_rescue: urgencyManager.getInventoryStatus('business_rescue'),
      enterprise_emergency: urgencyManager.getInventoryStatus('enterprise_emergency'),
    });

    socket.emit('social-proof-update', {
      recentActivity: urgencyManager.getRecentActivity(),
      visitorsToday: urgencyManager.saleMetrics.uniqueVisitors.size,
    });
  }, 30000); // Update every 30 seconds

  socket.on('disconnect', () => {
    clearInterval(updateInterval);
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {});

module.exports = { app, server, io };
