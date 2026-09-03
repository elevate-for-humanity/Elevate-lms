#!/usr/bin/env node

/**
 * Puppeteer Autopilot - Update Cloudflare API Token
 * Automatically updates/creates Cloudflare API token with correct permissions
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CLOUDFLARE_EMAIL = process.env.CLOUDFLARE_EMAIL;
const CLOUDFLARE_PASSWORD = process.env.CLOUDFLARE_PASSWORD;
const EXISTING_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const TOKEN_NAME = 'EFH Autopilot Durable Objects';

// Required permissions
const REQUIRED_PERMISSIONS = {
  Account: {
    'Account Settings': 'Read',
    'Workers Scripts': 'Edit',
    'Workers KV Storage': 'Edit',
  },
  User: {
    'User Details': 'Read',
  },
  Zone: {
    'Workers Routes': 'Edit',
  },
};

async function updateCloudflareToken() {

  // Validate credentials
  if (!CLOUDFLARE_EMAIL || !CLOUDFLARE_PASSWORD) {
    process.exit(1);
  }

  if (EXISTING_TOKEN) {
  }

  let browser;
  let token = null;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1400,900',
      ],
      defaultViewport: null,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Enable request interception for better debugging
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (
        request.resourceType() === 'image' ||
        request.resourceType() === 'font'
      ) {
        request.abort(); // Speed up by blocking images/fonts
      } else {
        request.continue();
      }
    });

    // Log console messages from the page
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
      }
    });


    // Navigate to Cloudflare login
    await page.goto('https://dash.cloudflare.com/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Fill in login form
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Clear and type email
    const emailInput = await page.$('input[type="email"]');
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(CLOUDFLARE_EMAIL, { delay: 50 });
    await page.waitForTimeout(500);

    // Clear and type password
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(CLOUDFLARE_PASSWORD, { delay: 50 });
    await page.waitForTimeout(500);

    // Take screenshot before login
    await page.screenshot({ path: 'cloudflare-login.png' });

    // Click login button
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('button[type="submit"]'),
      ]);
    } catch (error) {
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      if (!currentUrl.includes('login')) {
      } else {
        throw new Error('Login failed - still on login page');
      }
    }

    // Check for 2FA
    await page.waitForTimeout(3000);

    let url = page.url();
    let waitTime = 0;
    const maxWaitTime = 120; // 2 minutes max

    while (
      (url.includes('2fa') ||
        url.includes('verify') ||
        url.includes('challenge') ||
        url.includes('turnstile')) &&
      waitTime < maxWaitTime
    ) {
      if (waitTime === 0) {
        await page.screenshot({ path: 'cloudflare-2fa.png' });
      }

      await page.waitForTimeout(5000);
      waitTime += 5;
      url = page.url();

      if (waitTime % 15 === 0) {
      }
    }

    if (
      url.includes('2fa') ||
      url.includes('verify') ||
      url.includes('challenge')
    ) {
      throw new Error('2FA timeout - please complete verification faster');
    }


    // Navigate to API tokens page
    await page.goto('https://dash.cloudflare.com/profile/api-tokens', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await page.waitForTimeout(2000);

    // Check if token already exists
    await page.screenshot({ path: 'cloudflare-tokens-list.png' });

    const existingTokens = await page.evaluate((tokenName) => {
      const rows = Array.from(
        document.querySelectorAll('tr, [role="row"], div[class*="token"]')
      );
      const found = [];
      rows.forEach((row, index) => {
        if (row.textContent.includes(tokenName)) {
          found.push({ index, text: row.textContent.substring(0, 100) });
        }
      });
      return found;
    }, TOKEN_NAME);

    if (existingTokens.length > 0) {
        `⚠️  Found ${existingTokens.length} existing token(s) with name "${TOKEN_NAME}"`
      );

      for (const token of existingTokens) {

        // Find and click delete button
        const deleted = await page.evaluate((tokenName) => {
          const rows = Array.from(
            document.querySelectorAll('tr, [role="row"]')
          );
          const tokenRow = rows.find((row) =>
            row.textContent.includes(tokenName)
          );
          if (tokenRow) {
            // Try multiple selectors for delete button
            const deleteSelectors = [
              'button[aria-label*="Delete"]',
              'button[aria-label*="delete"]',
              'button[title*="Delete"]',
              'button[title*="delete"]',
              'button:has-text("Delete")',
              '[role="button"]:has-text("Delete")',
            ];

            for (const selector of deleteSelectors) {
              const deleteButton = tokenRow.querySelector(selector);
              if (deleteButton) {
                deleteButton.click();
                return true;
              }
            }

            // Try finding by icon or class
            const buttons = tokenRow.querySelectorAll('button');
            for (const btn of buttons) {
              if (
                btn.innerHTML.includes('trash') ||
                btn.innerHTML.includes('delete')
              ) {
                btn.click();
                return true;
              }
            }
          }
          return false;
        }, TOKEN_NAME);

        if (deleted) {
          await page.waitForTimeout(1500);

          // Confirm deletion
          const confirmed = await page.evaluate(() => {
            const confirmSelectors = [
              'button:has-text("Delete")',
              'button:has-text("Confirm")',
              'button:has-text("Yes")',
              'button[class*="danger"]',
              'button[class*="destructive"]',
            ];

            for (const selector of confirmSelectors) {
              const buttons = Array.from(document.querySelectorAll('button'));
              const confirmBtn = buttons.find(
                (btn) =>
                  btn.textContent.includes('Delete') ||
                  btn.textContent.includes('Confirm') ||
                  btn.textContent.includes('Yes')
              );
              if (confirmBtn) {
                confirmBtn.click();
                return true;
              }
            }
            return false;
          });

          if (confirmed) {
            await page.waitForTimeout(2000);
          } else {
          }
        } else {
        }
      }

    } else {
    }

    // Click "Create Token" button
    await page.waitForTimeout(2000);

    // Reload page to ensure clean state
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'cloudflare-before-create.png' });

    // Try multiple methods to click Create Token
    let createTokenClicked = false;

    // Method 1: Direct selector
    try {
      const createBtn = await page.$(
        'button:has-text("Create Token"), a:has-text("Create Token")'
      );
      if (createBtn) {
        await createBtn.click();
        createTokenClicked = true;
      }
    } catch (e) {}

    // Method 2: Evaluate and click
    if (!createTokenClicked) {
      createTokenClicked = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll('button, a, [role="button"]')
        );
        const createBtn = buttons.find((btn) => {
          const text = btn.textContent.toLowerCase();
          return (
            text.includes('create token') || text.includes('create api token')
          );
        });
        if (createBtn) {
          createBtn.click();
          return true;
        }
        return false;
      });
      if (createTokenClicked) {
      }
    }

    // Method 3: XPath
    if (!createTokenClicked) {
      try {
        const [button] = await page.$x(
          "//button[contains(text(), 'Create Token')] | //a[contains(text(), 'Create Token')]"
        );
        if (button) {
          await button.click();
          createTokenClicked = true;
        }
      } catch (e) {}
    }

    if (!createTokenClicked) {
      await page.screenshot({ path: 'cloudflare-create-token-error.png' });
      throw new Error(
        'Could not find Create Token button - check cloudflare-create-token-error.png'
      );
    }

    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'cloudflare-token-templates.png' });

    // Look for "Edit Cloudflare Workers" template

    let templateClicked = false;

    // Method 1: Look for Workers template button
    templateClicked = await page.evaluate(() => {
      const elements = Array.from(
        document.querySelectorAll(
          'button, a, div[role="button"], [class*="template"]'
        )
      );
      const workerTemplate = elements.find((el) => {
        const text = el.textContent.toLowerCase();
        return (
          text.includes('edit cloudflare workers') ||
          (text.includes('workers') && text.includes('edit'))
        );
      });
      if (workerTemplate) {
        // Find the actual clickable button within or near this element
        const clickable =
          workerTemplate.querySelector('button, a') || workerTemplate;
        clickable.click();
        return true;
      }
      return false;
    });

    if (templateClicked) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'cloudflare-workers-template.png' });
    } else {

      // Try to find and click "Use template" or "Get started" on Workers template
      const useTemplateClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));

        // First, find any element mentioning Workers
        const workerSection = Array.from(
          document.querySelectorAll('div, section')
        ).find(
          (el) =>
            el.textContent.includes('Edit Cloudflare Workers') ||
            el.textContent.includes('Workers Scripts')
        );

        if (workerSection) {
          // Look for "Use template" or similar button within that section
          const useBtn = workerSection.querySelector('button, a');
          if (useBtn) {
            useBtn.click();
            return true;
          }
        }

        // Fallback: Click custom token
        const customBtn = buttons.find((btn) => {
          const text = btn.textContent.toLowerCase();
          return (
            text.includes('custom token') || text.includes('create custom')
          );
        });
        if (customBtn) {
          customBtn.click();
          return true;
        }

        return false;
      });

      await page.waitForTimeout(3000);

      if (useTemplateClicked) {
      } else {
      }

      await page.screenshot({ path: 'cloudflare-custom-token.png' });
    }

    // Fill in token name

    // Wait for form to load
    await page.waitForTimeout(2000);

    // Find and fill token name
    const nameInputFilled = await page.evaluate((tokenName) => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nameInput = inputs.find((input) => {
        const placeholder = (input.placeholder || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const label = input.labels?.[0]?.textContent?.toLowerCase() || '';
        return (
          placeholder.includes('token name') ||
          placeholder.includes('name') ||
          name.includes('name') ||
          label.includes('token name')
        );
      });

      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
        nameInput.value = tokenName;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, TOKEN_NAME);

    if (nameInputFilled) {
    } else {
        '   ⚠️  Could not auto-fill token name, please enter manually'
      );
    }

    await page.waitForTimeout(2000);

    // Screenshot for debugging
    await page.screenshot({
      path: 'cloudflare-token-config.png',
      fullPage: true,
    });

    // Check if permissions are already set (from template)
    const permissionsSet = await page.evaluate(() => {
      const text = document.body.textContent.toLowerCase();
      return text.includes('workers scripts') && text.includes('edit');
    });

    if (permissionsSet) {
      await page.waitForTimeout(15000);
    } else {

      // Check every 10 seconds if user has progressed
      for (let i = 0; i < 6; i++) {
        await page.waitForTimeout(10000);
        const url = page.url();
        if (url.includes('summary') || url.includes('review')) {
          break;
        }
        if (i < 5) {
        }
      }
    }


    // Continue to summary
    let continueClicked = false;

    // Try multiple times to find continue button
    for (let attempt = 0; attempt < 3; attempt++) {
      continueClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const continueBtn = buttons.find((btn) => {
          const text = btn.textContent.toLowerCase();
          return (
            text.includes('continue') ||
            text.includes('summary') ||
            text.includes('next') ||
            text.includes('review')
          );
        });
        if (continueBtn && !continueBtn.disabled) {
          continueBtn.click();
          return true;
        }
        return false;
      });

      if (continueClicked) {
        await page.waitForTimeout(3000);
        break;
      }

      if (attempt < 2) {
          `   ⏳ Attempt ${attempt + 1}/3 - Continue button not ready, waiting...`
        );
        await page.waitForTimeout(2000);
      }
    }

    if (!continueClicked) {
        '   ⚠️  Could not find continue button, checking if already on summary...'
      );
      const url = page.url();
      if (!url.includes('summary') && !url.includes('review')) {
        await page.waitForTimeout(15000);
      }
    }

    await page.screenshot({
      path: 'cloudflare-token-summary.png',
      fullPage: true,
    });

    // Create token
    let createClicked = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      createClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const createBtn = buttons.find((btn) => {
          const text = btn.textContent.toLowerCase();
          return (
            text.includes('create token') || text.includes('create api token')
          );
        });
        if (createBtn && !createBtn.disabled) {
          createBtn.click();
          return true;
        }
        return false;
      });

      if (createClicked) {
        await page.waitForTimeout(5000);
        break;
      }

      if (attempt < 2) {
          `   ⏳ Attempt ${attempt + 1}/3 - Create button not ready, waiting...`
        );
        await page.waitForTimeout(2000);
      }
    }

    if (!createClicked) {
      await page.waitForTimeout(20000);
    } else {
    }

    // Extract the token
    await page.waitForTimeout(3000);

    // Take screenshot of token page
    await page.screenshot({
      path: 'cloudflare-token-result.png',
      fullPage: true,
    });

    // Try multiple methods to extract token

    token = await page.evaluate(() => {
      // Method 1: Look for code/pre tags
      const codeElements = document.querySelectorAll('code, pre, samp');
      for (const el of codeElements) {
        const text = el.textContent.trim();
        // Cloudflare tokens are typically 40+ characters, alphanumeric with dashes/underscores
        if (
          text.length > 35 &&
          text.length < 200 &&
          !text.includes(' ') &&
          !text.includes('\n')
        ) {
          return text;
        }
      }

      // Method 2: Look for readonly/disabled inputs
      const inputs = document.querySelectorAll(
        'input[readonly], input[disabled], input[type="text"]'
      );
      for (const input of inputs) {
        const value = input.value.trim();
        if (value.length > 35 && value.length < 200 && !value.includes(' ')) {
          return value;
        }
      }

      // Method 3: Look for textarea
      const textareas = document.querySelectorAll('textarea');
      for (const textarea of textareas) {
        const value = textarea.value.trim();
        if (
          value.length > 35 &&
          value.length < 200 &&
          !value.includes(' ') &&
          !value.includes('\n')
        ) {
          return value;
        }
      }

      // Method 4: Look for specific classes/attributes
      const tokenElements = document.querySelectorAll(
        '[class*="token"], [class*="api-key"], [class*="secret"], ' +
          '[data-token], [data-api-key], [id*="token"], [id*="api-key"]'
      );
      for (const el of tokenElements) {
        const text = el.textContent.trim();
        if (
          text.length > 35 &&
          text.length < 200 &&
          !text.includes(' ') &&
          !text.includes('\n')
        ) {
          return text;
        }

        // Check data attributes
        const dataToken =
          el.getAttribute('data-token') || el.getAttribute('data-api-key');
        if (dataToken && dataToken.length > 35) {
          return dataToken;
        }
      }

      // Method 5: Look for any long alphanumeric string in the page
      const allText = document.body.innerText;
      const matches = allText.match(/[A-Za-z0-9_-]{40,}/g);
      if (matches && matches.length > 0) {
        // Return the longest match (likely the token)
        return matches.reduce((a, b) => (a.length > b.length ? a : b));
      }

      return null;
    });

    if (token) {
    } else {

      // Wait and check clipboard
      await page.evaluate(() => {
        // Try to find and click copy button
        const buttons = Array.from(document.querySelectorAll('button'));
        const copyBtn = buttons.find((btn) => {
          const text = btn.textContent.toLowerCase();
          return text.includes('copy') || btn.innerHTML.includes('copy');
        });
        if (copyBtn) {
          copyBtn.click();
        }
      });

      await page.waitForTimeout(2000);

      // Try to read from clipboard (may not work due to permissions)
      try {
        token = await page.evaluate(() => navigator.clipboard.readText());
        if (token && token.length > 35) {
        } else {
          token = null;
        }
      } catch (e) {
      }
    }

    if (token) {
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );

      // Update .env file
      const envPath = path.join(__dirname, '..', '.env');
      let envContent = fs.readFileSync(envPath, 'utf8');

      if (envContent.includes('CLOUDFLARE_API_TOKEN=')) {
        envContent = envContent.replace(
          /CLOUDFLARE_API_TOKEN=.*/,
          `CLOUDFLARE_API_TOKEN=${token}`
        );
      } else {
        envContent += `\nCLOUDFLARE_API_TOKEN=${token}\n`;
      }

      fs.writeFileSync(envPath, envContent);

      // Save token to separate file for backup
      const tokenPath = path.join(__dirname, '..', 'cloudflare-token.txt');
      fs.writeFileSync(
        tokenPath,
        `Cloudflare API Token (${new Date().toISOString()})\n\n${token}\n`
      );

        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
        '   gh secret set AUTOPILOT_TOKEN --body "$(grep AUTOPILOT_TOKEN .env | cut -d= -f2)"'
      );
        '   git commit --allow-empty -m "Test autopilot" && git push'
      );
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );

      // Close browser after short delay
      await page.waitForTimeout(10000);
    } else {
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
      );
      await page.waitForTimeout(180000);
    }
  } catch (error) {
      '3. Check screenshots: cloudflare-token-config.png, cloudflare-token-result.png'
    );

    if (browser) {
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return token;
}

// Run the script
if (require.main === module) {
  updateCloudflareToken()
    .then((token) => {
      if (token) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      process.exit(1);
    });
}

module.exports = { updateCloudflareToken };
