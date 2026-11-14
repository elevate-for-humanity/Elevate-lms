#!/usr/bin/env node
/**
 * Database Connection Diagnostic Tool
 * Helps identify what's wrong with DATABASE_URL
 */

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL;

// 1. Check NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
} else {
  // Extract project ref
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (projectRef) {
  } else {
  }
}

// 2. Check SUPABASE_SERVICE_ROLE_KEY
if (!supabaseKey) {
} else {
  if (supabaseKey.startsWith('eyJ')) {
  } else {
  }
}

// 3. Check DATABASE_URL
if (!dbUrl) {
} else {
  // Parse the connection string
  try {
    const url = new URL(dbUrl.replace('postgresql://', 'http://'));

    // Check username format
    if (url.username === 'postgres') {
    } else if (url.username.startsWith('postgres.')) {
      const userProjectRef = url.username.split('.')[1];

      // Compare with SUPABASE_URL project ref
      if (supabaseUrl) {
        const urlProjectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (urlProjectRef && userProjectRef === urlProjectRef) {
        } else if (urlProjectRef) {
        }
      }
    } else {
    }

    // Check host format
    if (url.hostname.includes('pooler.supabase.com')) {
      if (url.port === '6543') {
      } else {
      }
    } else if (url.hostname.includes('supabase.co')) {
      if (url.port === '5432') {
      } else {
      }
    } else {
    }

    // Check password
    if (!url.password) {
    } else if (url.password.length < 10) {
    } else {
    }
  } catch (error) {}
}

// Summary

let issues = [];

if (!supabaseUrl) {
  issues.push('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
}

if (!supabaseKey) {
  issues.push('❌ SUPABASE_SERVICE_ROLE_KEY is not set');
}

if (!dbUrl) {
  issues.push('❌ DATABASE_URL is not set');
} else {
  try {
    const url = new URL(dbUrl.replace('postgresql://', 'http://'));

    // Check for project ref mismatch
    if (supabaseUrl && url.username.startsWith('postgres.')) {
      const dbProjectRef = url.username.split('.')[1];
      const urlProjectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

      if (dbProjectRef !== urlProjectRef) {
        issues.push(
          `❌ PROJECT REF MISMATCH: DATABASE_URL uses "${dbProjectRef}" but SUPABASE_URL uses "${urlProjectRef}"`,
        );
      }
    }

    // Check for missing password
    if (!url.password) {
      issues.push('❌ DATABASE_URL has no password');
    }

    // Check for wrong port
    if (url.hostname.includes('pooler') && url.port !== '6543') {
      issues.push(`❌ Wrong pooler port: ${url.port} (should be 6543)`);
    }
  } catch (error) {
    issues.push('❌ DATABASE_URL format is invalid');
  }
}

if (issues.length === 0) {
} else {
  issues.forEach((issue) => console.log(`   ${issue}`));

  if (!supabaseUrl || !supabaseKey || !dbUrl) {
  } else {
  }
}
