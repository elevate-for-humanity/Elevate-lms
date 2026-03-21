#!/usr/bin/env node

/**
 * Puppeteer Automation: Supabase SQL Execution
 *
 * Logs into Supabase and executes SQL from a file
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'elevateforhumanity';
const GITHUB_PASSWORD = process.env.GITHUB_PASSWORD || '';
const PROJECT_ID = process.env.SUPABASE_PROJECT_REF;
const SQL_FILE = path.join(process.cwd(), 'simple-credentials.sql');
const HEADLESS = process.env.HEADLESS !== 'false';
const USE_GITHUB_AUTH = true;

async function runSupabaseSQL() {

  // Check if SQL file exists
  if (!fs.existsSync(SQL_FILE)) {
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Go to Supabase login
    await page.goto('https://supabase.com/dashboard/sign-in', {
      waitUntil: 'networkidle2',
    });

    // Check if already logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/projects')) {
    } else {

      // Click "Sign in with GitHub" button
      await page.waitForSelector('button:has-text("GitHub"), a:has-text("GitHub")', { timeout: 10000 });
      await page.click('button:has-text("GitHub"), a:has-text("GitHub")');

      // Wait for GitHub login page
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      if (page.url().includes('github.com')) {

        // Fill in GitHub username
        await page.waitForSelector('input[name="login"]', { timeout: 10000 });
        await page.type('input[name="login"]', GITHUB_USERNAME);

        // Fill in GitHub password
        await page.type('input[name="password"]', GITHUB_PASSWORD);

        // Click sign in
        await page.click('input[type="submit"]');

        // Wait for redirect back to Supabase
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      } else {
      }
    }

    // Navigate to SQL Editor
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new`;
    await page.goto(sqlEditorUrl, { waitUntil: 'networkidle2' });

    // Wait for SQL editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 30000 });
    await page.waitForTimeout(2000); // Give Monaco editor time to initialize

    // Clear existing content and paste SQL

    // Click in the editor
    await page.click('.monaco-editor');

    // Select all and delete
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');

    // Type the SQL (Monaco editor requires typing, not paste)
    await page.keyboard.type(sqlContent, { delay: 0 });


    // Find and click Run button
    await page.waitForSelector('button:has-text("Run")', { timeout: 10000 });
    await page.click('button:has-text("Run")');

    // Wait for execution
    await page.waitForTimeout(5000);

    // Check for success or error
    const pageContent = await page.content();

    if (pageContent.includes('Success') || pageContent.includes('completed')) {
    } else if (pageContent.includes('error') || pageContent.includes('Error')) {
    } else {
    }

    // Take screenshot
    const screenshotPath = path.join(process.cwd(), 'supabase-sql-result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });


  } catch (error) {

    // Take error screenshot
    try {
      const errorScreenshot = path.join(process.cwd(), 'supabase-error.png');
       
      await page.screenshot({ path: errorScreenshot, fullPage: true });
    } catch (e) {}

    throw error;
  } finally {
    await browser.close();
  }
}

// Run the automation
runSupabaseSQL().catch((error) => {
  process.exit(1);
});
