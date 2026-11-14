#!/usr/bin/env node
/*
  OAuth Setup Helper for Social Media Platforms
  Helps you get access tokens for YouTube, LinkedIn, etc.
*/

const express = require('express');
const axios = require('axios');
const open = require('open');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Store tokens temporarily
const tokens = {};

// ============================================
// YOUTUBE OAUTH
// ============================================

app.get('/oauth/youtube', async (req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = `http://localhost:${PORT}/oauth/youtube/callback`;

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.force-ssl')}&` +
    `access_type=offline&` +
    `prompt=consent`;

  res.redirect(authUrl);
});

app.get('/oauth/youtube/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: `http://localhost:${PORT}/oauth/youtube/callback`,
      grant_type: 'authorization_code',
    });

    tokens.youtube = response.data;

    res.send(`
      <h1>✅ YouTube OAuth Successful!</h1>
      <p>Add these to your .env file:</p>
      <pre>
YOUTUBE_ACCESS_TOKEN=${response.data.access_token}
YOUTUBE_REFRESH_TOKEN=${response.data.refresh_token}
      </pre>
      <p>You can close this window.</p>
    `);

  } catch (error) {
    res.send(`<h1>❌ Error</h1><pre>${error.message}</pre>`);
  }
});

// ============================================
// LINKEDIN OAUTH
// ============================================

app.get('/oauth/linkedin', async (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `http://localhost:${PORT}/oauth/linkedin/callback`;

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent('w_member_social r_organization_social')}`;

  res.redirect(authUrl);
});

app.get('/oauth/linkedin/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: `http://localhost:${PORT}/oauth/linkedin/callback`,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    tokens.linkedin = response.data;

    res.send(`
      <h1>✅ LinkedIn OAuth Successful!</h1>
      <p>Add this to your .env file:</p>
      <pre>
LINKEDIN_ACCESS_TOKEN=${response.data.access_token}
      </pre>
      <p><strong>Note:</strong> LinkedIn tokens expire in ${response.data.expires_in} seconds (${Math.floor(response.data.expires_in / 86400)} days)</p>
      <p>You can close this window.</p>
    `);

      `Expires in: ${Math.floor(response.data.expires_in / 86400)} days`
    );
  } catch (error) {
    res.send(`<h1>❌ Error</h1><pre>${error.message}</pre>`);
  }
});

// ============================================
// FACEBOOK LONG-LIVED TOKEN
// ============================================

app.get('/oauth/facebook', async (req, res) => {
  res.send(`
    <h1>Facebook Long-Lived Token Generator</h1>
    <p>1. Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank">Graph API Explorer</a></p>
    <p>2. Select your app</p>
    <p>3. Click "Generate Access Token"</p>
    <p>4. Grant permissions: pages_manage_posts, pages_read_engagement</p>
    <p>5. Copy the short-lived token and paste below:</p>
    <form action="/oauth/facebook/exchange" method="GET">
      <input type="text" name="token" placeholder="Short-lived token" style="width: 400px; padding: 8px;" required />
      <button type="submit" style="padding: 8px 16px;">Exchange for Long-Lived Token</button>
    </form>
  `);
});

app.get('/oauth/facebook/exchange', async (req, res) => {
  const shortToken = req.query.token;

  try {
    const response = await axios.get(
      'https://graph.facebook.com/v18.0/oauth/access_token',
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: shortToken,
        },
      }
    );

    tokens.facebook = response.data;

    res.send(`
      <h1>✅ Facebook Long-Lived Token Generated!</h1>
      <p>Add this to your .env file:</p>
      <pre>
FACEBOOK_PAGE_1_TOKEN=${response.data.access_token}
      </pre>
      <p><strong>Note:</strong> This token expires in ~60 days. Set a reminder to refresh it.</p>
      <p>You can close this window.</p>
    `);

  } catch (error) {
    res.send(`<h1>❌ Error</h1><pre>${error.message}</pre>`);
  }
});

// ============================================
// HOME PAGE
// ============================================

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Social Media OAuth Setup</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #1e40af; }
          .platform { background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .platform h2 { margin-top: 0; }
          a { display: inline-block; background: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          a:hover { background: #1e3a8a; }
          .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
          .success { background: #d1fae5; color: #065f46; }
          .warning { background: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <h1>🔐 Social Media OAuth Setup</h1>
        <p>This tool helps you get access tokens for social media platforms.</p>

        <div class="platform">
          <h2>📘 Facebook</h2>
          <p>Get long-lived page access token (expires in ~60 days)</p>
          ${
            process.env.FACEBOOK_APP_ID
              ? '<div class="status success">✅ App ID configured</div>'
              : '<div class="status warning">⚠️ Set FACEBOOK_APP_ID in .env</div>'
          }
          <a href="/oauth/facebook">Setup Facebook Token</a>
        </div>

        <div class="platform">
          <h2>🎥 YouTube</h2>
          <p>Get OAuth tokens for YouTube Data API</p>
          ${
            process.env.YOUTUBE_CLIENT_ID
              ? '<div class="status success">✅ Client ID configured</div>'
              : '<div class="status warning">⚠️ Set YOUTUBE_CLIENT_ID in .env</div>'
          }
          <a href="/oauth/youtube">Setup YouTube OAuth</a>
        </div>

        <div class="platform">
          <h2>💼 LinkedIn</h2>
          <p>Get access token for LinkedIn Marketing API</p>
          ${
            process.env.LINKEDIN_CLIENT_ID
              ? '<div class="status success">✅ Client ID configured</div>'
              : '<div class="status warning">⚠️ Set LINKEDIN_CLIENT_ID in .env</div>'
          }
          <a href="/oauth/linkedin">Setup LinkedIn OAuth</a>
        </div>

        <hr style="margin: 40px 0;" />

        <h3>📝 Instructions</h3>
        <ol>
          <li>Make sure you've set up the required environment variables in .env</li>
          <li>Click the setup button for each platform</li>
          <li>Follow the OAuth flow in your browser</li>
          <li>Copy the generated tokens to your .env file</li>
          <li>Restart your application</li>
        </ol>

        <h3>🔗 Required Environment Variables</h3>
        <pre style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# YouTube
YOUTUBE_CLIENT_ID=your_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
        </pre>
      </body>
    </html>
  `);
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {

  // Auto-open browser
  setTimeout(() => {
    open(`http://localhost:${PORT}`);
  }, 1000);
});
