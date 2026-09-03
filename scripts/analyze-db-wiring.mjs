#!/usr/bin/env node

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative } from 'path';

const appDir = 'app';
const reportsDir = 'reports';

// Ensure reports directory exists
try {
  mkdirSync(reportsDir, { recursive: true });
} catch (e) {}

// Patterns to detect database operations
const dbPatterns = {
  supabaseQuery: /\.from\(['"`](\w+)['"`]\)/g,
  supabaseRpc: /\.rpc\(['"`](\w+)['"`]/g,
  supabaseSelect: /\.select\(['"`]([^'"`]+)['"`]\)/g,
  orgIdFilter: /\.eq\(['"`]organization_id['"`]/g,
  userIdFilter: /\.eq\(['"`]user_id['"`]/g,
  programIdFilter: /\.eq\(['"`]program_id['"`]/g,
  profileIdFilter: /\.eq\(['"`]profile_id['"`]/g,
};

// Route categories
const routeCategories = {
  public:
    /^\/(programs|about|contact|apply|blog|news|stories|employers|workforce|donate|privacy|terms|copyright|accessibility)/,
  auth: /^\/(login|signup|reset-password|verify|invite|auth)/,
  student: /^\/student\//,
  programHolder: /^\/(program-holder|shop|partners)\//,
  admin: /^\/admin\//,
  lms: /^\/lms\//,
  store: /^\/store\//,
  instructor: /^\/instructor\//,
  employer: /^\/employer\//,
};

function categorizeRoute(route) {
  for (const [category, pattern] of Object.entries(routeCategories)) {
    if (pattern.test(route)) return category;
  }
  return 'other';
}

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach((file) => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function analyzeFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const analysis = {
    tables: new Set(),
    rpcs: new Set(),
    hasOrgFilter: false,
    hasUserFilter: false,
    hasProgramFilter: false,
    hasProfileFilter: false,
    isServerComponent:
      content.includes('createClient') && content.includes('@/lib/supabase/server'),
    isClientComponent: content.includes("'use client'"),
    hasAuth: content.includes('getUser()') || content.includes('getSession()'),
  };

  // Extract table names
  let match;
  while ((match = dbPatterns.supabaseQuery.exec(content)) !== null) {
    analysis.tables.add(match[1]);
  }

  // Extract RPC calls
  dbPatterns.supabaseRpc.lastIndex = 0;
  while ((match = dbPatterns.supabaseRpc.exec(content)) !== null) {
    analysis.rpcs.add(match[1]);
  }

  // Check for filters
  analysis.hasOrgFilter = dbPatterns.orgIdFilter.test(content);
  analysis.hasUserFilter = dbPatterns.userIdFilter.test(content);
  analysis.hasProgramFilter = dbPatterns.programIdFilter.test(content);
  analysis.hasProfileFilter = dbPatterns.profileIdFilter.test(content);

  return {
    tables: Array.from(analysis.tables),
    rpcs: Array.from(analysis.rpcs),
    hasOrgFilter: analysis.hasOrgFilter,
    hasUserFilter: analysis.hasUserFilter,
    hasProgramFilter: analysis.hasProgramFilter,
    hasProfileFilter: analysis.hasProfileFilter,
    isServerComponent: analysis.isServerComponent,
    isClientComponent: analysis.isClientComponent,
    hasAuth: analysis.hasAuth,
  };
}

function buildDataContractMap() {
  const files = getAllFiles(appDir);
  const pageFiles = files.filter((f) => f.endsWith('page.tsx') || f.endsWith('page.ts'));

  const contractMap = {
    generated: new Date().toISOString(),
    totalRoutes: pageFiles.length,
    routes: {},
    summary: {
      byCategory: {},
      tablesUsed: {},
      rpcsUsed: {},
      missingFilters: [],
    },
  };

  pageFiles.forEach((filePath) => {
    const route =
      '/' +
      relative(appDir, filePath)
        .replace(/\/page\.tsx?$/, '')
        .replace(/\([\w-]+\)\//g, '')
        .replace(/\[(\w+)\]/g, ':$1');

    const category = categorizeRoute(route);
    const analysis = analyzeFile(filePath);

    contractMap.routes[route] = {
      file: filePath,
      category,
      ...analysis,
    };

    // Update summary
    contractMap.summary.byCategory[category] = (contractMap.summary.byCategory[category] || 0) + 1;

    analysis.tables.forEach((table) => {
      contractMap.summary.tablesUsed[table] = (contractMap.summary.tablesUsed[table] || 0) + 1;
    });

    analysis.rpcs.forEach((rpc) => {
      contractMap.summary.rpcsUsed[rpc] = (contractMap.summary.rpcsUsed[rpc] || 0) + 1;
    });

    // Flag missing filters on protected routes
    if (category !== 'public' && category !== 'auth' && analysis.tables.length > 0) {
      const needsOrgScope = ['programHolder', 'admin', 'instructor', 'employer'].includes(category);
      const needsUserScope = ['student', 'lms'].includes(category);

      if (needsOrgScope && !analysis.hasOrgFilter && analysis.tables.length > 0) {
        contractMap.summary.missingFilters.push({
          route,
          category,
          issue: 'missing_org_filter',
          tables: analysis.tables,
        });
      }

      if (
        needsUserScope &&
        !analysis.hasUserFilter &&
        !analysis.hasProfileFilter &&
        analysis.tables.length > 0
      ) {
        contractMap.summary.missingFilters.push({
          route,
          category,
          issue: 'missing_user_filter',
          tables: analysis.tables,
        });
      }
    }
  });

  return contractMap;
}

const contractMap = buildDataContractMap();

writeFileSync(join(reportsDir, 'data-contract-map.json'), JSON.stringify(contractMap, null, 2));
