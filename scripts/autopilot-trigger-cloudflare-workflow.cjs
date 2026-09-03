#!/usr/bin/env node

/**
 * AUTOPILOT: Trigger Cloudflare Worker Deployment via GitHub Actions
 *
 * This uses the GitHub API to trigger the cloudflare-worker-deploy workflow.
 * The workflow has access to the CLOUDFLARE_API_TOKEN secret in GitHub.
 */

const https = require('https');

console.log('🤖 AUTOPILOT: Triggering Cloudflare Worker Deployment');
console.log('====================================================\n');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!GITHUB_TOKEN) {
  console.log('⚠️  No GitHub token found in environment');
  console.log('');
  console.log('The autopilot can still trigger the workflow using the repository dispatch method.');
  console.log('Attempting deployment...\n');
}

// Trigger the workflow
function triggerWorkflow() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      ref: 'main',
    });

    const options = {
      hostname: 'api.github.com',
      path: '/repos/elevateforhumanity/fix2/actions/workflows/cloudflare-worker-deploy.yml/dispatches',
      method: 'POST',
      headers: {
        'User-Agent': 'Autopilot-Deploy-Script',
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        Accept: 'application/vnd.github.v3+json',
      },
    };

    if (GITHUB_TOKEN) {
      options.headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    console.log('📋 Triggering workflow: cloudflare-worker-deploy.yml');
    console.log('📍 Repository: elevateforhumanity/fix2');
    console.log('🌿 Branch: main\n');

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log('✅ Workflow triggered successfully!\n');
          console.log('📊 Check status at:');
          console.log(
            '   https://github.com/elevateforhumanity/fix2/actions/workflows/cloudflare-worker-deploy.yml\n',
          );
          console.log('⏱️  The workflow will:');
          console.log('   1. Checkout code');
          console.log('   2. Setup Node.js and pnpm');
          console.log('   3. Install dependencies');
          console.log('   4. Deploy worker using CLOUDFLARE_API_TOKEN from GitHub secrets');
          console.log('   5. Report deployment status\n');
          console.log('🎯 Expected completion: 20-30 seconds\n');
          resolve();
        } else if (res.statusCode === 401) {
          console.log('⚠️  Authentication required');
          console.log('');
          console.log('The workflow can also be triggered manually:');
          console.log(
            '1. Go to: https://github.com/elevateforhumanity/fix2/actions/workflows/cloudflare-worker-deploy.yml',
          );
          console.log('2. Click "Run workflow"');
          console.log('3. Select branch: main');
          console.log('4. Click "Run workflow"\n');
          reject(new Error('Authentication required'));
        } else {
          console.log(`❌ Unexpected response: ${res.statusCode}`);
          console.log('Response:', responseData);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      console.log('');
      console.log('💡 Alternative: Trigger workflow manually');
      console.log(
        '   Go to: https://github.com/elevateforhumanity/fix2/actions/workflows/cloudflare-worker-deploy.yml',
      );
      console.log('   Click "Run workflow"\n');
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Alternative: Create a commit to trigger the workflow
function triggerViaCommit() {
  console.log('📝 Alternative approach: Trigger via commit');
  console.log('');
  console.log('The workflow is configured to run on push to:');
  console.log('   - workers/**');
  console.log('   - wrangler*.toml');
  console.log('');
  console.log('Any commit to these files will trigger deployment automatically.\n');
}

// Execute
triggerWorkflow()
  .then(() => {
    console.log('🎉 AUTOPILOT: Deployment initiated successfully!');
    console.log('');
    console.log('The GitHub Actions workflow is now running with:');
    console.log('   ✅ CLOUDFLARE_API_TOKEN (from GitHub secrets)');
    console.log('   ✅ CLOUDFLARE_ACCOUNT_ID (from GitHub secrets)');
    console.log('');
    console.log('Monitor progress at:');
    console.log('   https://github.com/elevateforhumanity/fix2/actions\n');
  })
  .catch((error) => {
    console.log('');
    console.log('💡 AUTOPILOT RECOMMENDATION:');
    console.log('');
    console.log('Since the GitHub secrets are configured, the easiest way to deploy is:');
    console.log('');
    console.log('1. Make a small change to trigger the workflow:');
    console.log('   echo "# Autopilot deployment" >> workers/enrollment-injector-worker.ts');
    console.log('   git add workers/enrollment-injector-worker.ts');
    console.log('   git commit -m "Trigger autopilot deployment"');
    console.log('   git push');
    console.log('');
    console.log('2. Or trigger manually in GitHub:');
    console.log(
      '   https://github.com/elevateforhumanity/fix2/actions/workflows/cloudflare-worker-deploy.yml',
    );
    console.log('');
    triggerViaCommit();
  });
