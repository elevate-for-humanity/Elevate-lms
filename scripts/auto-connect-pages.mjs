#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the list of files to update
const filesToUpdate = fs.readFileSync('/tmp/pages_to_update.txt', 'utf-8')
  .split('\n')
  .filter(f => f.trim());


let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

filesToUpdate.forEach((filePath, index) => {
  try {
    const fullPath = path.join('/workspaces/workspaces', filePath);

    if (!fs.existsSync(fullPath)) {
      skippedCount++;
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;

    // Determine the portal type from path
    const isStudent = filePath.includes('/student/');
    const isAdmin = filePath.includes('/admin/');
    const isStaff = filePath.includes('/admin/staff-portal/');
    const isPartner = filePath.includes('/partner/');
    const isEmployer = filePath.includes('/employer/');

    // Skip if it's a complex query (has joins, specific filters, etc.)
    if (content.includes('.select(') && content.includes(',')) {
      // Has complex select with joins - skip
      skippedCount++;
      return;
    }

    // Skip if already has proper filters
    if (content.includes('.eq(\'user_id\'') ||
        content.includes('.eq(\'student_id\'') ||
        content.includes('.eq(\'role\'')) {
      skippedCount++;
      return;
    }

    // Only update simple template queries
    const simpleProfileQuery = /\.from\('profiles'\)\s*\.select\('\*'/g;

    if (!simpleProfileQuery.test(content)) {
      skippedCount++;
      return;
    }

    // This is a template page - mark it for manual review

    // Add a comment to mark it needs review
      content = content.replace(
        /\.from\('profiles'\)/,
      );

      fs.writeFileSync(fullPath, content, 'utf-8');
      updatedCount++;
    } else {
      skippedCount++;
    }

  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    errorCount++;
  }
});

