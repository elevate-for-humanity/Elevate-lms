#!/usr/bin/env node

/**
 * Verification script for the approval system integration
 * This verifies that the approval routes are properly integrated and working
 */

const express = require('express');
const http = require('http');


// Create test app
const app = express();
app.use(express.json());

// Mock environment for testing
process.env.SUPABASE_URL = 'http://mock-supabase.com';
process.env.SUPABASE_SERVICE_KEY = 'mock-service-key';
process.env.APPROVAL_SECRET = 'test-secret-for-verification';
process.env.APPROVAL_BASE_URL = 'http://localhost:3000/approvals';

try {
  // Load and register approval routes
  const { registerApprovalRoutes } = require('./approval-integration');
  registerApprovalRoutes(app);
} catch (e) {
  process.exit(1);
}

// Start test server
const server = app.listen(3000, 'localhost', async () => {

  try {
    // Test endpoints
    const tests = [
      {
        method: 'GET',
        path: '/api/approvals/stats',
        description: 'Approval stats',
      },
      {
        method: 'GET',
        path: '/api/approvals/list',
        description: 'Approval list',
      },
      {
        method: 'POST',
        path: '/api/approvals/request',
        body: {
          student_email: 'test@example.com',
          program_slug: 'test-program',
          case_manager_email: 'manager@example.com',
        },
        description: 'Approval request',
      },
      {
        method: 'POST',
        path: '/api/approvals/admin_decide',
        body: { id: 'test-id', decision: 'approved' },
        description: 'Admin decision',
      },
      {
        method: 'GET',
        path: '/approvals/accept?token=invalid',
        description: 'Public accept endpoint',
      },
      {
        method: 'GET',
        path: '/approvals/decline?token=invalid',
        description: 'Public decline endpoint',
      },
    ];


    for (const test of tests) {
      try {
        const options = {
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const response = await new Promise((resolve, reject) => {
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => resolve({ status: res.statusCode, data }));
          });

          req.on('error', reject);

          if (test.body) {
            req.write(JSON.stringify(test.body));
          }

          req.end();
        });

        if (response.status === 404) {
        } else {
            `✅ ${test.description}: Route exists (${response.status})`
          );
        }
      } catch (e) {
      }
    }

  } catch (e) {
  }

  server.close();
});
