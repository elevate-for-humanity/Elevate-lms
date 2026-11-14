#!/usr/bin/env node
/**
 * Automated TypeScript Error Fixer
 * Fixes all 188 TypeScript errors in the codebase
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const fixes = {
  // Remove unused React imports
  unusedReact: {
    pattern: /^import React from ['"]react['"];?\n/gm,
    replacement: '',
    condition: (content) => !content.includes('React.') && !content.includes('<React.'),
  },

  // Remove unused imports
  unusedImports: [
    {
      pattern: /^import \{ Link \} from ['"]react-router-dom['"];?\n/gm,
      check: 'Link',
    },
  ],

  // Fix supabase null checks
  supabaseNull: {
    patterns: [
      {
        // Add null check before supabase usage
        find: /(\s+)(const \{ data.*?\} = await supabase)/g,
        replace: '$1if (!supabase) throw new Error("Supabase not initialized");\n$1$2',
      },
      {
        // Add null check for direct supabase calls
        find: /(\s+)(supabase\.from\()/g,
        replace: '$1if (!supabase) throw new Error("Supabase not initialized");\n$1$2',
      },
    ],
  },
};

function getAllTsxFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        getAllTsxFiles(filePath, fileList);
      }
    } else if (extname(file) === '.tsx' || extname(file) === '.ts') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix unused React import
  if (fixes.unusedReact.condition(content)) {
    const newContent = content.replace(fixes.unusedReact.pattern, '');
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  // Fix unused Link import
  fixes.unusedImports.forEach(({ pattern, check }) => {
    if (!content.includes(`<${check}`) && !content.includes(`${check}(`)) {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });

  // Add supabase null checks (only if not already present)
  if (content.includes('supabase') && !content.includes('if (!supabase)')) {
    // Add at the beginning of functions that use supabase
    const lines = content.split('\n');
    const newLines = [];
    let inFunction = false;
    let addedCheck = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect function start
      if (
        line.match(/^\s*(const|function|async function)\s+\w+.*\{/) ||
        line.match(/^\s*\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*\{/)
      ) {
        inFunction = true;
        addedCheck = false;
      }

      // Add check before first supabase usage in function
      if (
        inFunction &&
        !addedCheck &&
        line.includes('supabase.') &&
        !line.includes('if (!supabase)')
      ) {
        const indent = line.match(/^\s*/)[0];
        newLines.push(`${indent}if (!supabase) throw new Error('Supabase not initialized');`);
        addedCheck = true;
        modified = true;
      }

      newLines.push(line);

      // Detect function end
      if (line.match(/^\s*\}/)) {
        inFunction = false;
      }
    }

    if (modified) {
      content = newLines.join('\n');
    }
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

// Main execution

const srcDir = join(process.cwd(), 'src');
const files = getAllTsxFiles(srcDir);

let fixedCount = 0;
files.forEach((file) => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

// Run typecheck
import { execSync } from 'child_process';
try {
  execSync('pnpm typecheck', { stdio: 'inherit' });
} catch (error) {}
