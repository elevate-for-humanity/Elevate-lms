#!/usr/bin/env node
/**
 * Apply Google Configuration Script
 * Replaces placeholders with actual Google Analytics and Search Console values
 * across HTML files in the project.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Try to load environment variables from .env.local if it exists
function loadEnvFile() {
  const envPath = path.join(ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

// Get environment variables with fallbacks
const GOOGLE_ANALYTICS_ID =
  process.env.GOOGLE_ANALYTICS_ID || process.env.VITE_ANALYTICS_ID;
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION;

// Placeholder patterns to replace
const PLACEHOLDERS = {
  GA_MEASUREMENT_ID: GOOGLE_ANALYTICS_ID,
  GOOGLE_VERIFICATION_CODE_HERE: GOOGLE_SITE_VERIFICATION,
  YOUR_GOOGLE_ANALYTICS_ID: GOOGLE_ANALYTICS_ID,
  YOUR_GOOGLE_SITE_VERIFICATION: GOOGLE_SITE_VERIFICATION,
};

/**
 * Get all HTML files in the root directory
 */
function getHtmlFiles() {
  return fs
    .readdirSync(ROOT)
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.join(ROOT, file));
}

/**
 * Replace placeholders in file content
 */
function replacePlaceholders(content) {
  let updatedContent = content;
  let replacementsMade = 0;

  Object.entries(PLACEHOLDERS).forEach(([placeholder, value]) => {
    if (value && updatedContent.includes(placeholder)) {
      const regex = new RegExp(placeholder, 'g');
      const matches = (updatedContent.match(regex) || []).length;
      updatedContent = updatedContent.replace(regex, value);
      replacementsMade += matches;
        `  ✓ Replaced ${matches} occurrence(s) of "${placeholder}" with "${value}"`
      );
    }
  });

  return { content: updatedContent, replacementsMade };
}

/**
 * Process a single HTML file
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: updatedContent, replacementsMade } =
      replacePlaceholders(content);

    if (replacementsMade > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
        `✅ Updated ${path.basename(filePath)} (${replacementsMade} replacements)`
      );
      return true;
    } else {
      return false;
    }
  } catch (error) {
      `❌ Error processing ${path.basename(filePath)}: ${error.message}`
    );
    return false;
  }
}

/**
 * Main execution function
 */
function main() {

  // Check if we have the required environment variables
  if (!GOOGLE_ANALYTICS_ID && !GOOGLE_SITE_VERIFICATION) {
      'Set GOOGLE_ANALYTICS_ID and/or GOOGLE_SITE_VERIFICATION to apply configurations.\n'
    );
    return;
  }

    `  Google Site Verification: ${GOOGLE_SITE_VERIFICATION || 'Not set'}\n`
  );

  const htmlFiles = getHtmlFiles();

  let totalFilesUpdated = 0;
  htmlFiles.forEach((file) => {
    if (processFile(file)) {
      totalFilesUpdated++;
    }
  });


  if (totalFilesUpdated > 0) {
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { replacePlaceholders, processFile };
