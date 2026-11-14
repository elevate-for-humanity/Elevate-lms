#!/usr/bin/env node

/**
 * Brand Color Reviewer
 * Enforces EFH brand color usage in the codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brand colors that should be used
const BRAND_COLORS = {
  primary: '#0066cc',
  'primary-hover': '#0052a3',
  'primary-active': '#003d7a',
  secondary: '#6c757d',
  'secondary-hover': '#5a6268',
  success: '#28a745',
  'success-hover': '#218838',
  info: '#17a2b8',
  'info-hover': '#138496',
  danger: '#dc3545',
  'danger-hover': '#c82333',
  warning: '#ffc107',
  'warning-hover': '#e0a800',
};

// Patterns to detect hardcoded colors
const COLOR_PATTERNS = [
  // Hex colors
  /#[0-9a-fA-F]{3,8}\b/g,
  // RGB/RGBA
  /rgba?\([^)]+\)/g,
  // HSL/HSLA
  /hsla?\([^)]+\)/g,
  // Tailwind color classes (not brand-)
  /(?:bg|text|border|ring)-(?!brand-)(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g,
];

// Files/directories to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'brand.css',
  'reviewer.js',
  '.stylelintrc.json',
];

// File extensions to check
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html'];

class BrandReviewer {
  constructor() {
    this.violations = [];
    this.filesChecked = 0;
  }

  shouldIgnore(filePath) {
    return IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern));
  }

  checkFile(filePath) {
    if (this.shouldIgnore(filePath)) return;
    if (!EXTENSIONS.some((ext) => filePath.endsWith(ext))) return;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      this.filesChecked++;

      lines.forEach((line, index) => {
        // Skip comments
        if (
          line.trim().startsWith('//') ||
          line.trim().startsWith('/*') ||
          line.trim().startsWith('*')
        ) {
          return;
        }

        COLOR_PATTERNS.forEach((pattern) => {
          const matches = line.matchAll(pattern);
          for (const match of matches) {
            const color = match[0];

            // Skip if it's a brand color variable reference
            if (color.includes('--brand-') || color.includes('var(')) {
              continue;
            }

            // Skip if it's a known brand color value (might be in brand.css)
            if (Object.values(BRAND_COLORS).includes(color.toLowerCase())) {
              continue;
            }

            // Skip common utility colors
            if (
              [
                '#fff',
                '#ffffff',
                '#000',
                '#000000',
                'transparent',
                'currentColor',
                'inherit',
              ].includes(color.toLowerCase())
            ) {
              continue;
            }

            this.violations.push({
              file: filePath,
              line: index + 1,
              color: color,
              context: line.trim(),
            });
          }
        });
      });
    } catch (error) {
    }
  }

  scanDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (this.shouldIgnore(fullPath)) continue;

        if (entry.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          this.checkFile(fullPath);
        }
      }
    } catch (error) {
    }
  }

  generateReport() {

    if (this.violations.length === 0) {
      return 0;
    }


    // Group violations by file
    const violationsByFile = {};
    this.violations.forEach((v) => {
      if (!violationsByFile[v.file]) {
        violationsByFile[v.file] = [];
      }
      violationsByFile[v.file].push(v);
    });

    Object.entries(violationsByFile).forEach(([file, violations]) => {
      violations.forEach((v) => {
      });
    });

      '  - Use brand color variables: var(--brand-primary), var(--brand-success), etc.'
    );
      '  - Use Tailwind brand classes: bg-brand-primary, text-brand-success, etc.'
    );

    return 1;
  }

  run(targetPath) {
    const rootPath = path.resolve(targetPath || process.cwd());


    const stats = fs.statSync(rootPath);
    if (stats.isDirectory()) {
      this.scanDirectory(rootPath);
    } else if (stats.isFile()) {
      this.checkFile(rootPath);
    }

    return this.generateReport();
  }
}

// CLI execution
const reviewer = new BrandReviewer();
const targetPath = process.argv[2] || 'src';
const exitCode = reviewer.run(targetPath);
process.exit(exitCode);
