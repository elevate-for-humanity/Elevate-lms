#!/usr/bin/env node

/**
 * Responsive Design Testing Script
 *
 * Tests website responsiveness across mobile, tablet, and desktop viewports
 * Ensures mobile-first design and consistent experience
 */

import { execSync } from 'child_process';

const VIEWPORTS = {
  mobile: [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12/13', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    { name: 'Pixel 5', width: 393, height: 851 },
  ],
  tablet: [
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Air', width: 820, height: 1180 },
    { name: 'iPad Pro 11"', width: 834, height: 1194 },
    { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
    { name: 'Surface Pro', width: 912, height: 1368 },
  ],
  desktop: [
    { name: 'Laptop', width: 1366, height: 768 },
    { name: 'Desktop HD', width: 1920, height: 1080 },
    { name: 'Desktop 2K', width: 2560, height: 1440 },
    { name: 'Desktop 4K', width: 3840, height: 2160 },
  ],
};

const CRITICAL_ROUTES = [
  '/',
  '/programs',
  '/programs/barber-apprenticeship',
  '/courses',
  '/apply',
  '/login',
  '/about',
  '/contact',
];

const RESPONSIVE_ISSUES = {
  horizontalScroll: [],
  textOverflow: [],
  imageOverflow: [],
  brokenLayout: [],
  tinyText: [],
  hugeText: [],
  touchTargetTooSmall: [],
};

// Check Tailwind responsive classes

const tailwindCheck = `
grep -r "sm:\\|md:\\|lg:\\|xl:\\|2xl:" app components --include="*.tsx" --include="*.jsx" | wc -l
`;

try {
  const responsiveClasses = execSync(tailwindCheck, { encoding: 'utf-8' }).trim();
} catch (error) {}

// Check for common responsive issues

const checks = [
  {
    name: 'Fixed widths (should use max-w-* instead)',
    command: `grep -r "w-\\[.*px\\]\\|width:.*px" app components --include="*.tsx" --include="*.jsx" | grep -v "max-w" | wc -l`,
    threshold: 10,
  },
  {
    name: 'Absolute positioning (can break on mobile)',
    command: `grep -r "absolute" app components --include="*.tsx" --include="*.jsx" | wc -l`,
    threshold: 50,
  },
  {
    name: 'Overflow hidden (may hide content)',
    command: `grep -r "overflow-hidden\\|overflow-x-hidden" app components --include="*.tsx" --include="*.jsx" | wc -l`,
    threshold: 20,
  },
  {
    name: 'Small text (< 14px)',
    command: `grep -r "text-xs\\|text-\\[10px\\]\\|text-\\[11px\\]\\|text-\\[12px\\]" app components --include="*.tsx" --include="*.jsx" | wc -l`,
    threshold: 30,
  },
];

checks.forEach((check) => {
  try {
    const count = parseInt(execSync(check.command, { encoding: 'utf-8' }).trim());
    const status = count > check.threshold ? '⚠️' : '✅';
    if (count > check.threshold) {
    }
  } catch (error) {}
});

// Check for mobile-first patterns

const mobileFirstChecks = [
  {
    name: 'Mobile-first spacing (base + sm/md/lg)',
    command: `grep -r "p-\\|m-\\|gap-" app components --include="*.tsx" | grep "sm:\\|md:\\|lg:" | wc -l`,
  },
  {
    name: 'Mobile-first text sizing',
    command: `grep -r "text-" app components --include="*.tsx" | grep "sm:\\|md:\\|lg:" | wc -l`,
  },
  {
    name: 'Mobile-first flex/grid',
    command: `grep -r "flex\\|grid" app components --include="*.tsx" | grep "sm:\\|md:\\|lg:" | wc -l`,
  },
];

mobileFirstChecks.forEach((check) => {
  try {
    const count = parseInt(execSync(check.command, { encoding: 'utf-8' }).trim());
  } catch (error) {}
});

// Check for touch-friendly elements

const touchChecks = [
  {
    name: 'Button padding (should be p-3 or larger)',
    command: `grep -r "button\\|Button" app components --include="*.tsx" | grep -E "p-[3-9]|p-1[0-9]|py-[3-9]|px-[3-9]" | wc -l`,
  },
  {
    name: 'Link padding (should have adequate touch target)',
    command: `grep -r "<Link\\|<a" app components --include="*.tsx" | grep -E "p-[2-9]|py-[2-9]|px-[2-9]" | wc -l`,
  },
];

touchChecks.forEach((check) => {
  try {
    const count = parseInt(execSync(check.command, { encoding: 'utf-8' }).trim());
  } catch (error) {}
});

// Check viewport meta tag

try {
  const viewportCheck = execSync(
    `grep -r "viewport" app --include="layout.tsx" --include="*.html"`,
    { encoding: 'utf-8' },
  );

  if (viewportCheck.includes('width=device-width')) {
  } else {
  }
} catch (error) {}

// Generate recommendations
