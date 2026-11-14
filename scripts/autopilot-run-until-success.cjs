#!/usr/bin/env node

/**
 * AUTOPILOT: RUN UNTIL SUCCESS - NO LIMITATIONS
 *
 * This script runs a command/worker until it succeeds.
 * NO max attempts, NO timeouts, NO giving up.
 *
 * Usage: node scripts/autopilot-run-until-success.cjs <command>
 *
 * Example: node scripts/autopilot-run-until-success.cjs "npm run build"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const command = process.argv.slice(2).join(' ');

if (!command) {
  console.log('❌ No command provided');
  console.log('Usage: node scripts/autopilot-run-until-success.cjs <command>');
  process.exit(1);
}

console.log('🤖 AUTOPILOT: RUN UNTIL SUCCESS');
console.log('================================\n');
console.log('Command:', command);
console.log('Strategy: NO LIMITATIONS - Run until successful\n');
console.log('Starting execution...\n');

let attempt = 0;
let success = false;
let lastError = null;

while (!success) {
  attempt++;
  console.log(`\n📋 Attempt #${attempt}`);
  console.log('─────────────────────────────────────\n');

  try {
    const output = execSync(command, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'pipe',
    });

    console.log(output);
    console.log('\n✅ SUCCESS!');
    console.log('─────────────────────────────────────');
    console.log(`\n🎉 Job completed successfully after ${attempt} attempt(s)`);
    success = true;
  } catch (error) {
    lastError = error;
    console.log('❌ FAILED\n');

    if (error.stdout) {
      console.log('Output:');
      console.log(error.stdout);
      console.log('');
    }

    if (error.stderr) {
      console.log('Error:');
      console.log(error.stderr);
      console.log('');
    }

    console.log('🔧 Analyzing error and fixing...\n');

    // Auto-fix common issues
    let fixed = false;

    // Check for missing dependencies
    if (
      error.message.includes('Cannot find module') ||
      error.message.includes('MODULE_NOT_FOUND')
    ) {
      console.log('💡 Detected: Missing dependency');
      console.log('🔧 Fixing: Installing dependencies...\n');

      try {
        execSync('pnpm install', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
        });
        console.log('\n✅ Dependencies installed');
        fixed = true;
      } catch (installError) {
        console.log('⚠️  Could not install dependencies automatically');
      }
    }

    // Check for permission errors
    if (error.message.includes('EACCES') || error.message.includes('permission denied')) {
      console.log('💡 Detected: Permission error');
      console.log('🔧 Fixing: Updating permissions...\n');

      // Try to fix permissions on common directories
      try {
        execSync('chmod -R u+rwx scripts/ 2>/dev/null || true', {
          cwd: path.join(__dirname, '..'),
          stdio: 'inherit',
        });
        console.log('✅ Permissions updated');
        fixed = true;
      } catch (permError) {
        console.log('⚠️  Could not fix permissions automatically');
      }
    }

    // Check for authentication errors
    if (
      error.message.includes('Authentication') ||
      error.message.includes('401') ||
      error.message.includes('403')
    ) {
      console.log('💡 Detected: Authentication error');
      console.log('🔧 This requires valid credentials');
      console.log('   Autopilot should provide fresh token\n');
    }

    // Check for network errors
    if (
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('network')
    ) {
      console.log('💡 Detected: Network error');
      console.log('🔧 Waiting 5 seconds before retry...\n');

      // Wait before retry
      execSync('sleep 5');
      fixed = true;
    }

    if (!fixed) {
      console.log('💡 Error requires manual fix or different approach');
      console.log('🔄 Retrying anyway (unlimited attempts)...\n');
    }

    // Wait a bit before retry
    console.log('⏳ Waiting 2 seconds before next attempt...\n');
    execSync('sleep 2');
  }
}

console.log('\n🎉 AUTOPILOT: JOB COMPLETED SUCCESSFULLY');
console.log('=========================================');
console.log(`Total attempts: ${attempt}`);
console.log('Status: SUCCESS');
console.log('');
