#!/usr/bin/env node
/**
 * Check required environment variables before build
 */

// Try to load dotenv if available (dev), but don't fail if not (production)
try {
  await import('dotenv/config');
} catch (e) {
  // dotenv not available, that's okay in production
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  missing.forEach((key) => {
  });
    '\nFor production, add these to your deployment platform environment variables.'
  );
    'For Northflank: set env vars in the service runtime environment or secret group'
  );
    'For Cloudflare Pages: https://dash.cloudflare.com/YOUR_ACCOUNT/pages/view/YOUR_PROJECT/settings/environment-variables\n'
  );
} else {
}
