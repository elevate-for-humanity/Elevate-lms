#!/usr/bin/env node

/**
 * Autopilot: Create Cloudflare API Token
 * Uses Cloudflare API to create a token with correct permissions
 */

const https = require('https');

const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL || 'elevateforhumanity@gmail.com';
const CLOUDFLARE_GLOBAL_API_KEY = process.env.CLOUDFLARE_GLOBAL_API_KEY;

async function createAPIToken() {
  console.log('🔑 Creating Cloudflare API Token...');
  console.log('');

  if (!CLOUDFLARE_GLOBAL_API_KEY) {
    console.log('❌ CLOUDFLARE_GLOBAL_API_KEY not set');
    console.log('');
    console.log('To create an API token, you need your Global API Key:');
    console.log('1. Go to: https://dash.cloudflare.com/profile/api-tokens');
    console.log('2. Scroll to "Global API Key" section');
    console.log('3. Click "View" and copy the key');
    console.log('4. Set: export CLOUDFLARE_GLOBAL_API_KEY=your-key');
    console.log('5. Run this script again');
    console.log('');
    process.exit(1);
  }

  const tokenData = {
    name: 'EFH Autopilot Worker Deploy',
    policies: [
      {
        effect: 'allow',
        resources: {
          'com.cloudflare.api.account.*': '*',
        },
        permission_groups: [
          {
            id: 'c8fed203ed3043cba015a93ad1616f1f',
            name: 'Workers Scripts Write',
          },
          {
            id: 'e086da7e2179491d91ee5f35b3ca210a',
            name: 'Workers Routes Write',
          },
        ],
      },
    ],
  };

  const options = {
    hostname: 'api.cloudflare.com',
    path: '/client/v4/user/tokens',
    method: 'POST',
    headers: {
      'X-Auth-Email': CLOUDFLARE_EMAIL,
      'X-Auth-Key': CLOUDFLARE_GLOBAL_API_KEY,
      'Content-Type': 'application/json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.result) {
            console.log('✅ Token created successfully!');
            console.log('');
            console.log('Token:', response.result.value);
            console.log('');
            resolve(response.result.value);
          } else {
            console.log('❌ Failed to create token');
            console.log('Response:', JSON.stringify(response, null, 2));
            reject(new Error('Token creation failed'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(tokenData));
    req.end();
  });
}

if (require.main === module) {
  createAPIToken()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}

module.exports = { createAPIToken };
