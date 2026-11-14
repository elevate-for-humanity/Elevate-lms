#!/usr/bin/env node

/**
 * Brand Color Auto-Fixer
 * Automatically replaces hardcoded colors with brand tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color mapping: hardcoded color -> brand token
const COLOR_MAP = {
  // Hex colors to brand tokens
  '#0066cc': 'var(--brand-primary)',
  '#0052a3': 'var(--brand-primary-hover)',
  '#003d7a': 'var(--brand-primary-active)',
  '#6c757d': 'var(--brand-secondary)',
  '#5a6268': 'var(--brand-secondary-hover)',
  '#28a745': 'var(--brand-success)',
  '#218838': 'var(--brand-success-hover)',
  '#17a2b8': 'var(--brand-info)',
  '#138496': 'var(--brand-info-hover)',
  '#dc3545': 'var(--brand-danger)',
  '#c82333': 'var(--brand-danger-hover)',
  '#ffc107': 'var(--brand-warning)',
  '#e0a800': 'var(--brand-warning-hover)',

  // Common grays to brand tokens
  '#6b7280': 'var(--brand-text-muted)',
  '#9ca3af': 'var(--brand-text-light)',
  '#e5e7eb': 'var(--brand-border)',
  '#d1d5db': 'var(--brand-border-dark)',
  '#f8fafc': 'var(--brand-surface)',
  '#f1f5f9': 'var(--brand-surface-dark)',
  '#f9fafb': 'var(--brand-surface)',

  // Common blues (map to info)
  '#1e40af': 'var(--brand-info)',
  '#3b82f6': 'var(--brand-info)',
  '#2563eb': 'var(--brand-info)',
  '#1d4ed8': 'var(--brand-info-hover)',
  '#eff6ff': 'var(--brand-surface)',

  // Common greens (map to success)
  '#059669': 'var(--brand-success)',
  '#10b981': 'var(--brand-success)',
  '#16a34a': 'var(--brand-success)',
  '#15803d': 'var(--brand-success-hover)',

  // Common reds (map to danger)
  '#dc2626': 'var(--brand-danger)',
  '#ef4444': 'var(--brand-danger)',
  '#f87171': 'var(--brand-danger)',
  '#b91c1c': 'var(--brand-danger-hover)',

  // Common purples (map to secondary)
  '#7c3aed': 'var(--brand-secondary)',
  '#8b5cf6': 'var(--brand-secondary)',
  '#a78bfa': 'var(--brand-secondary)',

  // Common ambers/yellows (map to warning)
  '#f59e0b': 'var(--brand-warning)',
  '#fbbf24': 'var(--brand-warning)',
  '#d97706': 'var(--brand-warning-hover)',

  // Text colors
  '#1f2937': 'var(--brand-text)',
  '#374151': 'var(--brand-text)',
  '#111827': 'var(--brand-text)',

  // Additional grays (common in codebase)
  '#666': 'var(--brand-text-muted)',
  '#666666': 'var(--brand-text-muted)',
  '#e0e0e0': 'var(--brand-border)',
  '#ddd': 'var(--brand-border)',
  '#dddddd': 'var(--brand-border)',
  '#e2e8f0': 'var(--brand-border)',
  '#64748b': 'var(--brand-text-muted)',

  // Additional blues
  '#007bff': 'var(--brand-info)',
};

// Tailwind class mappings
const TAILWIND_CLASS_MAP = {
  // Background colors
  'bg-indigo-50': 'bg-brand-surface',
  'bg-indigo-100': 'bg-brand-surface',
  'bg-indigo-600': 'bg-brand-info',
  'bg-indigo-700': 'bg-brand-info-hover',
  'bg-blue-100': 'bg-brand-surface',
  'bg-blue-600': 'bg-brand-info',
  'bg-blue-700': 'bg-brand-info-hover',

  'bg-slate-50': 'bg-brand-surface',
  'bg-slate-100': 'bg-brand-surface-dark',
  'bg-slate-800': 'bg-brand-secondary',
  'bg-slate-900': 'bg-brand-secondary-hover',

  'bg-green-100': 'bg-brand-surface',
  'bg-green-600': 'bg-brand-success',
  'bg-green-700': 'bg-brand-success-hover',

  'bg-red-100': 'bg-brand-surface',
  'bg-red-600': 'bg-brand-danger',
  'bg-red-700': 'bg-brand-danger-hover',

  'bg-amber-50': 'bg-brand-surface',
  'bg-amber-100': 'bg-brand-surface',
  'bg-amber-500': 'bg-brand-warning',
  'bg-amber-600': 'bg-brand-warning-hover',
  'bg-amber-700': 'bg-brand-warning-hover',

  'bg-purple-100': 'bg-brand-surface',
  'bg-purple-600': 'bg-brand-secondary',
  'bg-purple-700': 'bg-brand-secondary-hover',

  'bg-orange-100': 'bg-brand-surface',
  'bg-pink-100': 'bg-brand-surface',

  // Gray backgrounds
  'bg-gray-50': 'bg-brand-surface',
  'bg-gray-100': 'bg-brand-surface-dark',
  'bg-gray-200': 'bg-brand-border',

  // Text colors
  'text-gray-500': 'text-brand-text-light',
  'text-gray-600': 'text-brand-text-muted',
  'text-gray-700': 'text-brand-text',
  'text-gray-800': 'text-brand-text',
  'text-gray-900': 'text-brand-text',

  // Blue text
  'text-blue-600': 'text-brand-info',
  'text-blue-700': 'text-brand-info',

  // Green text
  'text-green-600': 'text-brand-success',

  // Text colors
  'text-indigo-700': 'text-brand-info',
  'text-indigo-800': 'text-brand-info',
  'text-indigo-600': 'text-brand-info',

  'text-slate-500': 'text-brand-text-light',
  'text-slate-600': 'text-brand-text-muted',
  'text-slate-700': 'text-brand-text',
  'text-slate-900': 'text-brand-text',

  'text-green-800': 'text-brand-success',
  'text-blue-800': 'text-brand-info',
  'text-purple-800': 'text-brand-secondary',
  'text-pink-800': 'text-brand-danger',
  'text-orange-800': 'text-brand-warning',
  'text-amber-600': 'text-brand-warning',
  'text-amber-700': 'text-brand-warning',
  'text-amber-800': 'text-brand-warning',

  // Border colors
  'border-slate-200': 'border-brand-border',
  'border-slate-300': 'border-brand-border-dark',
  'border-amber-200': 'border-brand-border',
  'border-gray-200': 'border-brand-border',
  'border-gray-300': 'border-brand-border-dark',

  // Hover states
  'hover:bg-indigo-100': 'hover:bg-brand-surface-dark',
  'hover:bg-indigo-700': 'hover:bg-brand-info-hover',
  'hover:bg-slate-50': 'hover:bg-brand-surface',
  'hover:bg-slate-100': 'hover:bg-brand-surface-dark',
  'hover:bg-slate-900': 'hover:bg-brand-secondary-hover',
  'hover:bg-amber-600': 'hover:bg-brand-warning-hover',
  'hover:bg-amber-700': 'hover:bg-brand-warning-hover',
  'hover:bg-green-700': 'hover:bg-brand-success-hover',
  'hover:bg-gray-50': 'hover:bg-brand-surface',
  'hover:bg-gray-100': 'hover:bg-brand-surface-dark',

  'hover:text-indigo-600': 'hover:text-brand-info',
  'hover:text-blue-600': 'hover:text-brand-info',

  // Ring colors (focus states)
  'ring-blue-500': 'ring-brand-focus',
  'ring-indigo-500': 'ring-brand-focus',

  // Focus states
  'focus:border-blue-500': 'focus:border-brand-primary',
  'focus:ring-blue-200': 'focus:ring-brand-focus',
  'focus:ring-blue-500': 'focus:ring-brand-focus',
};

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
  'fix-brand-colors.js',
  '.stylelintrc.json',
];

// File extensions to process
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.css', '.html'];

class BrandColorFixer {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.filesModified = 0;
    this.replacements = 0;
    this.changes = [];
  }

  shouldIgnore(filePath) {
    return IGNORE_PATTERNS.some((pattern) => filePath.includes(pattern));
  }

  fixHexColors(content) {
    let modified = content;
    let count = 0;

    Object.entries(COLOR_MAP).forEach(([hex, brandToken]) => {
      const regex = new RegExp(hex.replace('#', '#'), 'gi');
      const matches = modified.match(regex);
      if (matches) {
        modified = modified.replace(regex, brandToken);
        count += matches.length;
      }
    });

    return { content: modified, count };
  }

  fixRgbaColors(content) {
    const modified = content;
    const count = 0;

    // Common RGBA patterns to brand tokens
    const rgbaMap = {
      'rgba(0,0,0,0.1)': 'rgba(0, 0, 0, 0.1)', // Keep common transparencies
      'rgba(0, 0, 0, 0.1)': 'rgba(0, 0, 0, 0.1)',
      'rgba(0,0,0,0.05)': 'rgba(0, 0, 0, 0.05)',
      'rgba(0, 0, 0, 0.05)': 'rgba(0, 0, 0, 0.05)',
    };

    // Note: RGBA is often used for shadows/opacity, which are context-specific
    // We'll leave most RGBA as-is for now, but normalize spacing

    return { content: modified, count };
  }

  fixTailwindClasses(content) {
    let modified = content;
    let count = 0;

    Object.entries(TAILWIND_CLASS_MAP).forEach(([oldClass, newClass]) => {
      // Match whole class names with word boundaries
      const regex = new RegExp(
        `\\b${oldClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'g'
      );
      const matches = modified.match(regex);
      if (matches) {
        modified = modified.replace(regex, newClass);
        count += matches.length;
      }
    });

    return { content: modified, count };
  }

  fixFile(filePath) {
    if (this.shouldIgnore(filePath)) return;
    if (!EXTENSIONS.some((ext) => filePath.endsWith(ext))) return;

    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let modifiedContent = originalContent;
      let fileReplacements = 0;

      // Fix hex colors
      const hexResult = this.fixHexColors(modifiedContent);
      modifiedContent = hexResult.content;
      fileReplacements += hexResult.count;

      // Fix Tailwind classes
      const tailwindResult = this.fixTailwindClasses(modifiedContent);
      modifiedContent = tailwindResult.content;
      fileReplacements += tailwindResult.count;

      if (modifiedContent !== originalContent) {
        this.filesModified++;
        this.replacements += fileReplacements;

        this.changes.push({
          file: filePath,
          replacements: fileReplacements,
        });

        if (!this.dryRun) {
          fs.writeFileSync(filePath, modifiedContent, 'utf8');
        }
      }
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
          this.fixFile(fullPath);
        }
      }
    } catch (error) {
    }
  }

  generateReport() {

    if (this.dryRun) {
    }


    if (this.changes.length === 0) {
      return 0;
    }

    if (this.dryRun) {
    } else {
    }

    this.changes.forEach((change) => {
    });

    return 0;
  }

  run(targetPath) {
    const rootPath = path.resolve(targetPath || process.cwd());

      `🔧 ${this.dryRun ? 'Analyzing' : 'Fixing'} brand color violations in: ${rootPath}\n`
    );

    const stats = fs.statSync(rootPath);
    if (stats.isDirectory()) {
      this.scanDirectory(rootPath);
    } else if (stats.isFile()) {
      this.fixFile(rootPath);
    }

    return this.generateReport();
  }
}

// CLI execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const targetPath = args.find((arg) => !arg.startsWith('-')) || 'src';

const fixer = new BrandColorFixer(dryRun);
const exitCode = fixer.run(targetPath);
process.exit(exitCode);
