/**
 * PARIS Import Engine - GitHub Repository Analyzer
 * Analyzes GitHub repositories to detect framework, dependencies, routes, and components
 */

import { createClient } from '@supabase/supabase-js';
import type {
  RepositoryAnalysis,
  RepositoryInfo,
  Framework,
  Database,
  AuthProvider,
  Dependency,
  Route,
  Component,
  EnvironmentVariable,
  ThirdPartyIntegration,
  BuildProcess,
  ImportResult,
} from './types';

// GitHub API client (using unauthenticated for public repos)
const GITHUB_API = 'https://api.github.com';

interface GitHubRepoResponse {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  html_url: string;
}

interface GitHubContentsResponse {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
}

interface GitHubBranchResponse {
  name: string;
  commit: { sha: string };
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/.*)?$/,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return { owner: match[1], repo: match[2].replace('.git', '') };
    }
  }
  return null;
}

/**
 * Fetch repository metadata from GitHub API
 */
async function fetchRepoInfo(owner: string, repo: string): Promise<RepositoryInfo> {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'PARIS-Import-Engine',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repo info: ${response.statusText}`);
  }

  const data: GitHubRepoResponse = await response.json();

  return {
    owner,
    repo,
    url: data.html_url,
    defaultBranch: data.default_branch,
    description: data.description || '',
    language: data.language || 'Unknown',
    stars: data.stargazers_count,
    forks: data.forks_count,
    topics: data.topics || [],
  };
}

/**
 * List repository contents recursively
 */
async function listContents(
  owner: string,
  repo: string,
  path: string = '',
  branch: string = 'main'
): Promise<GitHubContentsResponse[]> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PARIS-Import-Engine',
      },
    }
  );

  if (!response.ok) {
    // Try 'master' branch if 'main' fails
    if (branch === 'main') {
      return listContents(owner, repo, path, 'master');
    }
    return [];
  }

  return response.json();
}

/**
 * Fetch file content from GitHub
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<string> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'PARIS-Import-Engine',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch file ${path}: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Detect framework from package.json and file structure
 */
function detectFramework(
  pkg: Record<string, unknown>,
  files: string[]
): Framework {
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };

  // Next.js
  if (deps.next) return 'nextjs';

  // React frameworks
  if (deps.react && files.some(f => f.includes('gatsby'))) return 'gatsby';
  if (deps.react && files.some(f => f.includes('remix'))) return 'remix';

  // Vue frameworks
  if (deps.vue && deps.nuxt) return 'nuxt';
  if (deps.vue) return 'vue';

  // Svelte frameworks
  if (deps.svelte && deps.svelteKit) return 'svelte';
  if (deps.svelte) return 'svelte';

  // React without specific framework
  if (deps.react) return 'react';

  // Node.js frameworks
  if (deps.express) return 'express';
  if (deps.fastify) return 'fastify';
  if (deps.nestjs) return 'nestjs';

  // Python frameworks
  if (deps.django) return 'django';
  if (deps.flask) return 'flask';

  // Ruby frameworks
  if (deps.rails) return 'rails';

  // PHP frameworks
  if (deps.laravel) return 'laravel';

  // Java frameworks
  if (deps.spring_boot || deps.spring) return 'spring';

  // .NET
  if (deps.aspnet || deps['@nestjs/core']) return 'dotnet';

  // WordPress
  if (files.some(f => f.includes('wp-content') || f.includes('wordpress'))) return 'wordpress';

  // Shopify
  if (files.some(f => f.includes('shopify') || f.includes('liquid'))) return 'shopify';

  return 'unknown';
}

/**
 * Detect database from dependencies and config files
 */
function detectDatabase(
  pkg: Record<string, unknown>,
  files: string[]
): Database {
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };

  if (deps.prisma) return 'postgresql';
  if (deps['@prisma/client']) return 'postgresql';
  if (deps.mongoose) return 'mongodb';
  if (deps.mongo) return 'mongodb';
  if (deps.mysql2 || deps.mysql) return 'mysql';
  if (deps.pg) return 'postgresql';
  if (deps.sqlite3) return 'sqlite';
  if (deps.ioredis || deps.redis) return 'redis';
  if (deps['@supabase/supabase-js']) return 'supabase';
  if (deps.firebase) return 'firebase';
  if (deps['@aws-sdk/client-dynamodb']) return 'dynamodb';
  if (deps.apollo-server || deps['@apollo/server'] || deps.graphql) return 'graphql';

  // Check for config files
  if (files.includes('supabase') || files.some(f => f.includes('supabase'))) return 'supabase';

  return 'unknown';
}

/**
 * Detect authentication provider
 */
function detectAuth(pkg: Record<string, unknown>, files: string[]): AuthProvider {
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };

  if (deps['@supabase/supabase-js'] || deps.supabase) return 'supabase';
  if (deps.firebase) return 'firebase';
  if (deps['@auth0/auth0-spa-js'] || deps.auth0) return 'auth0';
  if (deps['@clerk/clerk-react'] || deps.clerk) return 'clerk';
  if (deps['next-auth'] || deps['next-auth']) return 'nextauth';
  if (deps['passport'] || deps['passport-jwt']) return 'passport';
  if (deps.jsonwebtoken || deps.jwt) return 'jwt';

  // Check for OAuth config files
  if (files.some(f => f.includes('oauth') || f.includes('auth0'))) return 'oauth';

  return 'unknown';
}

interface SecurityFlag {
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
}

/**
 * Analyze security risks
 */
function analyzeSecurityRisks(files: string[], pkg: Record<string, unknown>): SecurityFlag[] {
  const risks: SecurityFlag[] = [];
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };

  // Check for sensitive files
  // eslint-disable-next-line no-useless-escape
  const sensitivePatterns: Array<{ pattern: RegExp; severity: string; desc: string }> = [
    { pattern: /\.env$/, severity: 'high' as const, desc: 'Environment file without .gitignore' },
    { pattern: /\.env\.local$/, severity: 'medium' as const, desc: 'Local env file present' },
    { pattern: /\.env\.example$/, severity: 'low' as const, desc: 'Example env file found' },
    { pattern: 'id_rsa', severity: 'critical' as const, desc: 'SSH private key found' },
    // eslint-disable-next-line no-useless-escape
    { pattern: 'config\.php', severity: 'high' as const, desc: 'PHP config file may contain credentials' },
    // eslint-disable-next-line no-useless-escape
    { pattern: 'credentials\.json', severity: 'high' as const, desc: 'Google credentials file' },
    // eslint-disable-next-line no-useless-escape
    { pattern: 'secrets\.json', severity: 'critical' as const, desc: 'Secrets file found' },
  ];

  for (const file of files) {
    for (const { pattern, severity, desc } of sensitivePatterns) {
      if (file.includes(pattern.replace(/^\./, ''))) {
        risks.push({
          severity,
          location: file,
          description: desc,
        });
      }
    }
  }

  // Check for outdated or vulnerable packages
  const knownVulnerable = ['event-stream', 'flatmap-stream', 'lodash'];
  for (const pkgName of knownVulnerable) {
    if (deps[pkgName]) {
      risks.push({
        severity: 'critical',
        location: `package.json:${pkgName}`,
        description: `Known vulnerable package: ${pkgName}`,
      });
    }
  }

  return risks;
}

/**
 * Detect routes from file structure
 */
function detectRoutes(files: string[], framework: Framework): Route[] {
  const routes: Route[] = [];

  // Next.js pages router
  if (framework === 'nextjs') {
    const pageFiles = files.filter(f => f.includes('pages/') && f.endsWith('.tsx') || f.endsWith('.jsx'));
    for (const file of pageFiles) {
      const match = file.match(/pages\/(.+)\.(tsx|jsx)$/);
      if (match) {
        let path = '/' + match[1].replace(/index$/, '');
        if (path.endsWith('/')) path = path.slice(0, -1);
        if (!path) path = '/';
        routes.push({
          path: path === '/_' ? '/' : path,
          component: file,
          file,
        });
      }
    }
  }

  // Next.js app router
  const appFiles = files.filter(f => f.includes('app/') && (f.endsWith('/page.tsx') || f.endsWith('/page.jsx')));
  for (const file of appFiles) {
    const match = file.match(/app\/(.+)\/page\.(tsx|jsx)$/);
    if (match) {
      const path = '/' + match[1];
      routes.push({
        path,
        component: file,
        file,
      });
    }
  }

  // React Router
  if (framework === 'react') {
    const routeFiles = files.filter(f => f.includes('routes') || f.includes('Router'));
    for (const file of routeFiles) {
      routes.push({
        path: '(dynamic)',
        component: 'Router Config',
        file,
      });
    }
  }

  // Vue/Nuxt
  if (framework === 'vue' || framework === 'nuxt') {
    const viewFiles = files.filter(f => f.includes('views/') || f.includes('pages/'));
    for (const file of viewFiles) {
      const match = file.match(/(?:views|pages)\/(.+)\.(vue|js)$/);
      if (match) {
        routes.push({
          path: '/' + match[1].replace(/index$/, ''),
          component: file,
          file,
        });
      }
    }
  }

  return routes;
}

/**
 * Detect components from file structure
 */
function detectComponents(files: string[], framework: Framework): Component[] {
  const components: Component[] = [];

  const componentPatterns: Record<string, RegExp[]> = {
    nextjs: [/\/components\/(.+)\.(tsx|jsx)$/, /\/app\/.+\/(?!page)[^/]+\.(tsx|jsx)$/],
    react: [/\/components\/(.+)\.(tsx|jsx|jsx)$/, /\/ui\/(.+)\.(tsx|jsx)$/],
    vue: [/\/components\/(.+)\.vue$/, /\/components\/.+\/(.+)\.vue$/],
    svelte: [/\/components\/(.+)\.svelte$/],
    angular: [/\/app\/.+\.(component|module)\.ts$/],
  };

  const patterns = componentPatterns[framework] || componentPatterns.react;

  for (const file of files) {
    for (const pattern of patterns) {
      const match = file.match(pattern);
      if (match) {
        const name = match[1].split('/').pop() || match[1];
        const type = file.includes('/components/') ? 'component' :
                     file.includes('/app/') && !file.includes('page') ? 'component' :
                     file.includes('/ui/') ? 'component' :
                     file.includes('/hooks/') ? 'hook' :
                     file.includes('/lib/') || file.includes('/utils/') ? 'util' :
                     file.includes('/api/') ? 'api' :
                     'page';

        components.push({
          name,
          type: type as Component['type'],
          file,
          linesOfCode: 0, // Would need to fetch file to count
        });
        break;
      }
    }
  }

  return components;
}

/**
 * Parse dependencies from package.json
 */
function parseDependencies(pkg: Record<string, unknown>): { production: Dependency[]; development: Dependency[] } {
  const production: Dependency[] = [];
  const development: Dependency[] = [];

  const deps = pkg.dependencies as Record<string, string> || {};
  for (const [name, version] of Object.entries(deps)) {
    production.push({ name, version, type: 'production' });
  }

  const devDeps = pkg.devDependencies as Record<string, string> || {};
  for (const [name, version] of Object.entries(devDeps)) {
    development.push({ name, version, type: 'development' });
  }

  return { production, development };
}

/**
 * Detect build process
 */
function detectBuildProcess(pkg: Record<string, unknown>, files: string[]): BuildProcess {
  const scripts = pkg.scripts as Record<string, string> || {};
  const deps = pkg.dependencies as Record<string, string> || {};

  const command = scripts.build || 'unknown';
  let framework: string | undefined;
  let bundler: string | undefined;

  if (deps.next) framework = 'Next.js';
  if (deps.gatsby) framework = 'Gatsby';
  if (deps.remix) framework = 'Remix';
  if (deps.vue) framework = 'Vue';

  if (command.includes('next build')) bundler = 'Next.js';
  else if (command.includes('webpack')) bundler = 'Webpack';
  else if (command.includes('vite')) bundler = 'Vite';
  else if (command.includes('esbuild')) bundler = 'esbuild';

  const outputDir = 
    command.includes('out') ? 'out' :
    command.includes('.next') ? '.next' :
    command.includes('dist') ? 'dist' :
    'build';

  return {
    command: `npm run build (or: ${command})`,
    outputDir,
    framework,
    bundler,
  };
}

/**
 * Detect third-party integrations
 */
function detectIntegrations(pkg: Record<string, unknown>, files: string[]): ThirdPartyIntegration[] {
  const integrations: ThirdPartyIntegration[] = [];
  const deps = { ...(pkg.dependencies as Record<string, string> || {}), ...(pkg.devDependencies as Record<string, string> || {}) };

  const integrationMap: Record<string, { name: string; category: ThirdPartyIntegration['category'] }> = {
    stripe: { name: 'Stripe', category: 'payment' },
    '@stripe/stripe-js': { name: 'Stripe', category: 'payment' },
    paypal: { name: 'PayPal', category: 'payment' },
    '@paypal/react-paypal-js': { name: 'PayPal', category: 'payment' },
    sentry: { name: 'Sentry', category: 'analytics' },
    '@sentry/nextjs': { name: 'Sentry', category: 'analytics' },
    mixpanel: { name: 'Mixpanel', category: 'analytics' },
    segment: { name: 'Segment', category: 'analytics' },
    '@segment/analytics-next': { name: 'Segment', category: 'analytics' },
    mailchimp: { name: 'Mailchimp', category: 'email' },
    '@mailchimp/mailchimp_marketing': { name: 'Mailchimp', category: 'email' },
    sendgrid: { name: 'SendGrid', category: 'email' },
    '@sendgrid/mail': { name: 'SendGrid', category: 'email' },
    twilio: { name: 'Twilio', category: 'sms' },
    '@twilio/conversations': { name: 'Twilio', category: 'sms' },
    '@openai/': { name: 'OpenAI', category: 'ai' },
    'langchain': { name: 'LangChain', category: 'ai' },
    'cloudinary': { name: 'Cloudinary', category: 'storage' },
    'aws-sdk': { name: 'AWS S3', category: 'storage' },
    '@supabase/supabase-js': { name: 'Supabase', category: 'storage' },
    firebase: { name: 'Firebase', category: 'storage' },
    hubspot: { name: 'HubSpot', category: 'crm' },
    '@hubspot/api-client': { name: 'HubSpot', category: 'crm' },
  };

  for (const [pkgName, config] of Object.entries(integrationMap)) {
    if (deps[pkgName] || deps[pkgName.replace('/', '')]) {
      integrations.push({
        name: config.name,
        category: config.category,
        config: { package: pkgName },
      });
    }
  }

  return integrations;
}

/**
 * Detect environment variables from code
 */
function detectEnvironmentVariables(files: string[]): EnvironmentVariable[] {
  const envVars: EnvironmentVariable[] = [];
  const commonPatterns = [
    { name: 'DATABASE_URL', required: true, desc: 'Database connection string' },
    { name: 'API_KEY', required: true, desc: 'API authentication key', isSecret: true },
    { name: 'SECRET_KEY', required: true, desc: 'Application secret key', isSecret: true },
    { name: 'STRIPE_KEY', required: false, desc: 'Stripe API key', isSecret: true },
    { name: 'NEXT_PUBLIC_', required: false, desc: 'Public environment variable', isSecret: false },
    { name: 'REACT_APP_', required: false, desc: 'React environment variable', isSecret: false },
  ];

  return commonPatterns.map(p => ({
    name: p.name,
    required: p.required,
    description: p.desc,
    isSecret: p.isSecret || false,
  }));
}

/**
 * Detect design system
 */
function detectDesignSystem(files: string[], pkg: Record<string, unknown>): RepositoryAnalysis['designSystem'] {
  const deps = pkg.dependencies as Record<string, string> || {};

  const cssFramework = 
    deps.tailwindcss || deps['@tailwindcss/'] ? 'tailwind' :
    deps.bootstrap || deps['react-bootstrap'] ? 'bootstrap' :
    deps['@mui/material'] || deps['@material-ui/core'] ? 'material' :
    deps['@chakra-ui/react'] ? 'chakra' :
    deps['@radix-ui/'] ? 'radix' :
    undefined;

  if (!cssFramework) return undefined;

  return {
    cssFramework,
    fonts: ['Inter', 'system-ui'], // Default assumption
  };
}

/**
 * Main analyzer function
 */
export async function analyzeGitHubRepository(
  owner: string,
  repo: string,
  options?: { token?: string; branch?: string }
): Promise<RepositoryAnalysis> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'PARIS-Import-Engine',
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const branch = options?.branch || 'main';

  // Fetch repo info
  const info = await fetchRepoInfo(owner, repo);

  // Get file tree
  const allFiles: string[] = [];
  
  async function traverseDir(path: string) {
    const contents = await listContents(owner, repo, path, branch);
    for (const item of contents) {
      if (item.type === 'file') {
        allFiles.push(item.path);
      } else if (item.type === 'dir' && !item.name.includes('node_modules') && !item.name.includes('.git')) {
        await traverseDir(item.path);
      }
    }
  }

  await traverseDir('');

  // Fetch package.json
  let pkg: Record<string, unknown> = {};
  try {
    const pkgContent = await fetchFileContent(owner, repo, 'package.json', branch);
    pkg = JSON.parse(pkgContent);
  } catch (e) {
    console.warn('No package.json found');
  }

  // Detect framework and database
  const framework = detectFramework(pkg, allFiles);
  const database = detectDatabase(pkg, allFiles);
  const auth = detectAuth(pkg, allFiles);

  // Parse dependencies
  const { production, development } = parseDependencies(pkg);

  // Detect routes and components
  const routes = detectRoutes(allFiles, framework);
  const components = detectComponents(allFiles, framework);

  // Detect integrations
  const integrations = detectIntegrations(pkg, allFiles);

  // Detect environment variables
  const environmentVariables = detectEnvironmentVariables(allFiles);

  // Detect build process
  const build = detectBuildProcess(pkg, allFiles);

  // Analyze security
  const securityFlags = analyzeSecurityRisks(allFiles, pkg);

  // Detect design system
  const designSystem = detectDesignSystem(allFiles, pkg);

  // Check code quality indicators
  const codeQuality = {
    typescript: allFiles.some(f => f.endsWith('.ts') || f.endsWith('.tsx')),
    eslint: allFiles.some(f => f.includes('eslint') || f.includes('.eslintrc')),
    prettier: allFiles.some(f => f.includes('prettier') || f.includes('.prettierrc')),
    testing: allFiles.some(f => f.includes('test') || f.includes('spec') || f.includes('__tests__')),
  };

  // Check licensing
  let licensing = { name: 'Unknown', compatible: true, notes: 'Please review LICENSE file' };
  try {
    const licenseContent = await fetchFileContent(owner, repo, 'LICENSE', branch);
    if (licenseContent.toLowerCase().includes('mit')) {
      licensing = { name: 'MIT', compatible: true };
    } else if (licenseContent.toLowerCase().includes('apache')) {
      licensing = { name: 'Apache 2.0', compatible: true };
    } else if (licenseContent.toLowerCase().includes('gpl')) {
      licensing = { name: 'GPL', compatible: true, notes: 'May require derivative works to be open source' };
    } else if (licenseContent.toLowerCase().includes('bsd')) {
      licensing = { name: 'BSD', compatible: true };
    }
  } catch (e) {
    // No LICENSE file found
  }

  // Generate warnings
  const warnings: string[] = [];
  if (allFiles.some(f => f.includes('node_modules'))) {
    warnings.push('node_modules directory found in repository');
  }
  if (allFiles.some(f => f.includes('.env'))) {
    warnings.push('Environment files may contain sensitive data');
  }
  if (!codeQuality.testing) {
    warnings.push('No testing framework detected');
  }
  if (!codeQuality.typescript) {
    warnings.push('Project does not use TypeScript - may require type conversions');
  }
  if (framework === 'unknown') {
    warnings.push('Could not determine framework - manual review recommended');
  }

  return {
    info,
    framework,
    database,
    auth,
    dependencies: {
      production,
      development,
      total: production.length + development.length,
    },
    routes,
    components,
    environmentVariables,
    integrations,
    build,
    designSystem,
    codeQuality,
    securityFlags,
    licensing,
    analysisTimestamp: new Date().toISOString(),
    warnings,
  };
}

/**
 * High-level import function
 */
export async function importFromGitHub(
  url: string,
  options?: { token?: string; branch?: string }
): Promise<ImportResult> {
  const parsed = parseGitHubUrl(url);
  
  if (!parsed) {
    return {
      success: false,
      errors: ['Invalid GitHub URL format'],
    };
  }

  try {
    const analysis = await analyzeGitHubRepository(parsed.owner, parsed.repo, options);
    
    return {
      success: true,
      analysis,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
}
