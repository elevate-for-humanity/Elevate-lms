#!/usr/bin/env node
// 🚦 CI ignore script - exits 0 to skip build, 1 to proceed
import { execSync } from 'node:child_process';

function getChangeInfo() {
  try {
    const output = execSync('node scripts/changed-paths.mjs --json', {
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString();
    return JSON.parse(output);
  } catch (error) {
    // If we can't determine changes, build to be safe
    return { shouldBuild: true, appRelevant: ['unknown'] };
  }
}

const { shouldBuild, appRelevant, buildType, categories } = getChangeInfo();

if (!shouldBuild) {
  process.exit(0); // Exit 0 = ignore build
} else {
  // Show categorized changes for better visibility
  if (categories.html?.length > 0) {
  }
  if (categories.pages?.length > 0) {
  }
  if (categories.assets?.length > 0) {
  }
  if (categories.seo?.length > 0) {
  }
  if (categories.config?.length > 0) {
  }

  process.exit(1); // Exit 1 = proceed with build
}
