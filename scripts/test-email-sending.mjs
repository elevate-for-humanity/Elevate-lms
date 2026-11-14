#!/usr/bin/env node

/**
 * Email Sending Test Script
 * Tests if email service is configured and working
 */

import { Resend } from 'resend';

// Test 1: Environment Variable
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  process.exit(1);
}

if (apiKey.startsWith('re_')) {
} else {
}

// Test 2: Create Resend Client
let resend;
try {
  resend = new Resend(apiKey);
} catch (error) {
  process.exit(1);
}

// Test 3: Send Test Email (optional - only if TEST_EMAIL is set)
const testEmail = process.env.TEST_EMAIL;

if (testEmail) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Elevate for Humanity <onboarding@resend.dev>',
      to: [testEmail],
      subject: 'Test Email - Elevate for Humanity',
      html: `
        <h1>Email Test Successful</h1>
        <p>This is a test email from your Elevate for Humanity deployment.</p>
        <p>If you received this, email sending is working correctly!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });

    if (error) {
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
} else {
}

if (testEmail) {
} else {
}

process.exit(0);
