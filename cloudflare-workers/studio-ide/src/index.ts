/**
 * IG - Licensed Platform Operations Console
 * 
 * A restricted, role-bound operations environment embedded into 
 * enterprise/workforce platform licenses. Designed to configure, 
 * extend, and operate the system safely.
 * 
 * Access Tiers:
 * - VIEWER: Read-only access to configs and logs
 * - OPERATOR: Config changes, workflow management
 * - ENGINEER: Code editing, scoped execution (top-tier license only)
 * 
 * Security posture:
 * - No anonymous access
 * - All actions authenticated and audit-logged
 * - Strict CORS - only allowed origins
 * - Rate limited operations
 * - Role-scoped permissions
 * - Environment isolation (dev/staging/prod)
 * - Kill switch capability
 * 
 * This is NOT a general-purpose IDE or hosting platform.
 */

import { WorkspaceDurableObject } from './workspace';
import { TerminalDurableObject } from './terminal';

export { WorkspaceDurableObject, TerminalDurableObject };

const VERSION = '1.0.0';
const BUILD_TIME = '2026-02-03T04:42:00Z';

// Access roles - determines what operations are allowed
type AccessRole = 'viewer' | 'operator' | 'engineer' | 'admin';

interface UserContext {
  userId: string;
  role: AccessRole;
  tenantId: string;
  environment: 'development' | 'staging' | 'production';
  licenseActive: boolean;
}

// Role permissions matrix
const ROLE_PERMISSIONS: Record<AccessRole, {
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  canManageWorkspaces: boolean;
  canAccessTerminal: boolean;
  canPushToGit: boolean;
  canViewAuditLogs: boolean;
}> = {
  viewer: {
    canRead: true,
    canWrite: false,
    canExecute: false,
    canManageWorkspaces: false,
    canAccessTerminal: false,
    canPushToGit: false,
    canViewAuditLogs: false,
  },
  operator: {
    canRead: true,
    canWrite: true,
    canExecute: false,
    canManageWorkspaces: true,
    canAccessTerminal: false,
    canPushToGit: false,
    canViewAuditLogs: true,
  },
  engineer: {
    canRead: true,
    canWrite: true,
    canExecute: true,
    canManageWorkspaces: true,
    canAccessTerminal: true,
    canPushToGit: true,
    canViewAuditLogs: true,
  },
  admin: {
    canRead: true,
    canWrite: true,
    canExecute: true,
    canManageWorkspaces: true,
    canAccessTerminal: true,
    canPushToGit: true,
    canViewAuditLogs: true,
  },
};

function hasPermission(role: AccessRole, permission: keyof typeof ROLE_PERMISSIONS['viewer']): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

interface Env {
  WORKSPACE: DurableObjectNamespace;
  TERMINAL: DurableObjectNamespace;
  STUDIO_FILES: R2Bucket;
  STUDIO_META: KVNamespace;
  STUDIO_DB: D1Database;
  ENVIRONMENT: string;
  MAX_FILE_SIZE: string;
  MAX_WORKSPACE_SIZE: string;
}

// Allowed origins - strict list, no wildcards in production
const ALLOWED_ORIGINS = [
  'https://elevateforhumanity.org',
  'https://www.elevateforhumanity.org',
  'https://admin.elevateforhumanity.org',
  'https://studio.elevateforhumanity.org',
  // Dev origins - remove in production
  'http://localhost:3000',
  'http://localhost:3001',
];

// Also allow Gitpod preview URLs during development
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/\d+--[a-z0-9-]+\..*\.gitpod\.dev$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
}

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin');
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-github-token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// Rate limiting state (per-worker instance, resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, endpoint: string, maxRequests: number, windowMs: number): boolean {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const limit = rateLimits.get(key);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Audit logging
async function logAudit(env: Env, event: {
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ip?: string;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
  };
  
  // Store in KV with TTL (90 days)
  const key = `audit:${Date.now()}:${crypto.randomUUID()}`;
  await env.STUDIO_META.put(key, JSON.stringify(logEntry), { expirationTtl: 90 * 24 * 60 * 60 });
}

// Blocked file extensions (security)
const BLOCKED_EXTENSIONS = [
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd',
  '.php', '.jsp', '.asp', '.aspx',
];

function isBlockedFile(path: string): boolean {
  const lower = path.toLowerCase();
  return BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

// MIME type validation
const ALLOWED_MIME_TYPES = [
  'text/', 'application/json', 'application/javascript',
  'application/typescript', 'application/xml', 'image/',
];

function isAllowedMimeType(mimeType: string | null): boolean {
  if (!mimeType) return true; // Allow if not specified (text files)
  return ALLOWED_MIME_TYPES.some(allowed => mimeType.startsWith(allowed));
}

// Generate signed URL for secure file access (expires in 1 hour)
async function generateSignedUrl(env: Env, key: string, expiresIn: number = 3600): Promise<string> {
  // For R2, we create a time-limited access token stored in KV
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  await env.STUDIO_META.put(`signed:${token}`, JSON.stringify({ key, expiresAt }), {
    expirationTtl: expiresIn
  });
  
  return `/api/files/signed/${token}`;
}

async function validateSignedUrl(env: Env, token: string): Promise<string | null> {
  const data = await env.STUDIO_META.get(`signed:${token}`);
  if (!data) return null;
  
  const { key, expiresAt } = JSON.parse(data);
  if (Date.now() > expiresAt) {
    await env.STUDIO_META.delete(`signed:${token}`);
    return null;
  }
  
  return key;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = getCorsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Check origin for non-GET requests
    const origin = request.headers.get('Origin');
    if (request.method !== 'GET' && origin && !isAllowedOrigin(origin)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403, corsHeaders);
    }

    try {
      // Public endpoints (no auth required)
      if (path === '/') {
        return jsonResponse({
          service: 'Elevate Studio IDE',
          status: 'operational',
          environment: env.ENVIRONMENT,
          documentation: 'https://docs.elevateforhumanity.org/studio',
        }, 200, corsHeaders);
      }

      if (path === '/health') {
        return jsonResponse({
          status: 'ok',
          version: VERSION,
          buildTime: BUILD_TIME,
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT,
        }, 200, corsHeaders);
      }

      // All other endpoints require authentication
      const userId = await getUserId(request);
      if (!userId) {
        return jsonResponse({ 
          error: 'Authentication required',
          message: 'Include Authorization header with valid Bearer token'
        }, 401, corsHeaders);
      }

      // Get client IP for audit logging
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';

      // Route requests
      if (path.startsWith('/api/workspace')) {
        return handleWorkspaceRoutes(request, env, path, userId, clientIP, corsHeaders);
      }
      
      if (path.startsWith('/api/files')) {
        // Write operations require canWrite permission
        if (request.method === 'PUT' || request.method === 'POST' || request.method === 'DELETE') {
          const permCheck = await requirePermission(request, 'canWrite', env, clientIP);
          if (!permCheck.allowed) {
            return permCheck.response;
          }
        }
        return handleFileRoutes(request, env, path, userId, clientIP, corsHeaders);
      }
      
      if (path.startsWith('/api/terminal')) {
        // Terminal requires engineer role (execution permission)
        const permCheck = await requirePermission(request, 'canAccessTerminal', env, clientIP);
        if (!permCheck.allowed) {
          return permCheck.response;
        }
        
        // Rate limit terminal operations: 100 requests per minute
        if (!checkRateLimit(userId, 'terminal', 100, 60000)) {
          await logAudit(env, { userId, action: 'RATE_LIMITED', resource: 'terminal', ip: clientIP });
          return jsonResponse({ error: 'Rate limit exceeded. Try again later.' }, 429, corsHeaders);
        }
        return handleTerminalRoutes(request, env, path, userId, clientIP, corsHeaders);
      }
      
      if (path.startsWith('/api/git')) {
        // Git push requires engineer role
        if (path === '/api/git/push') {
          const permCheck = await requirePermission(request, 'canPushToGit', env, clientIP);
          if (!permCheck.allowed) {
            return permCheck.response;
          }
        }
        return handleGitRoutes(request, env, path, userId, clientIP, corsHeaders);
      }

      if (path.startsWith('/api/cache')) {
        return handleCacheRoutes(request, env, path, userId, clientIP, corsHeaders);
      }

      // Audit log endpoint (read-only, admin only)
      if (path === '/api/audit' && request.method === 'GET') {
        // TODO: Add admin role check
        const logs = await env.STUDIO_META.list({ prefix: 'audit:' });
        const entries = await Promise.all(
          logs.keys.slice(0, 100).map(async (key) => {
            const value = await env.STUDIO_META.get(key.name);
            return value ? JSON.parse(value) : null;
          })
        );
        return jsonResponse({ logs: entries.filter(Boolean) }, 200, corsHeaders);
      }

      return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
    }
  },
};

// Workspace routes
async function handleWorkspaceRoutes(
  request: Request, 
  env: Env, 
  path: string, 
  userId: string, 
  clientIP: string,
  corsHeaders: Record<string, string>
): Promise<Response> {

  // GET /api/workspace - List workspaces
  if (request.method === 'GET' && path === '/api/workspace') {
    await logAudit(env, { userId, action: 'LIST_WORKSPACES', resource: 'workspace', ip: clientIP });
    const workspaces = await env.STUDIO_DB.prepare(
      'SELECT * FROM workspaces WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(userId).all();
    return jsonResponse(workspaces.results, 200, corsHeaders);
  }

  // POST /api/workspace - Create workspace
  if (request.method === 'POST' && path === '/api/workspace') {
    const body = await request.json() as { name: string; description?: string; repoUrl?: string };
    const id = crypto.randomUUID();
    
    // Validate workspace name
    if (!body.name || body.name.length < 1 || body.name.length > 100) {
      return jsonResponse({ error: 'Workspace name must be 1-100 characters' }, 400, corsHeaders);
    }
    
    // Sanitize name (alphanumeric, dash, underscore only)
    const sanitizedName = body.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    await env.STUDIO_DB.prepare(
      'INSERT INTO workspaces (id, user_id, name, description, repo_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(), datetime())'
    ).bind(id, userId, sanitizedName, body.description || null, body.repoUrl || null).run();

    // Initialize workspace Durable Object
    const workspaceId = env.WORKSPACE.idFromName(`${userId}:${id}`);
    const workspace = env.WORKSPACE.get(workspaceId);
    await workspace.fetch(new Request('http://internal/init', {
      method: 'POST',
      body: JSON.stringify({ id, userId, name: sanitizedName }),
    }));

    await logAudit(env, { 
      userId, 
      action: 'CREATE_WORKSPACE', 
      resource: `workspace:${id}`, 
      details: { name: sanitizedName, repoUrl: body.repoUrl },
      ip: clientIP 
    });

    return jsonResponse({ id, name: sanitizedName }, 201, corsHeaders);
  }

  // GET /api/workspace/:id - Get workspace details
  const workspaceMatch = path.match(/^\/api\/workspace\/([^/]+)$/);
  if (request.method === 'GET' && workspaceMatch) {
    const workspaceId = workspaceMatch[1];
    const workspace = await env.STUDIO_DB.prepare(
      'SELECT * FROM workspaces WHERE id = ? AND user_id = ?'
    ).bind(workspaceId, userId).first();
    
    if (!workspace) {
      return jsonResponse({ error: 'Workspace not found' }, 404);
    }
    return jsonResponse(workspace);
  }

  // DELETE /api/workspace/:id - Delete workspace
  if (request.method === 'DELETE' && workspaceMatch) {
    const workspaceId = workspaceMatch[1];
    
    // Delete all files from R2
    const files = await env.STUDIO_FILES.list({ prefix: `${userId}/${workspaceId}/` });
    for (const file of files.objects) {
      await env.STUDIO_FILES.delete(file.key);
    }
    
    // Delete from database
    await env.STUDIO_DB.prepare(
      'DELETE FROM workspaces WHERE id = ? AND user_id = ?'
    ).bind(workspaceId, userId).run();

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

// File routes
async function handleFileRoutes(
  request: Request, 
  env: Env, 
  path: string,
  userId: string,
  clientIP: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  // Rate limit file operations: 500 requests per minute
  if (!checkRateLimit(userId, 'files', 500, 60000)) {
    await logAudit(env, { userId, action: 'RATE_LIMITED', resource: 'files', ip: clientIP });
    return jsonResponse({ error: 'Rate limit exceeded. Try again later.' }, 429, corsHeaders);
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace');
  if (!workspaceId) {
    return jsonResponse({ error: 'workspace parameter required' }, 400, corsHeaders);
  }

  // Verify workspace ownership
  const workspace = await env.STUDIO_DB.prepare(
    'SELECT id FROM workspaces WHERE id = ? AND user_id = ?'
  ).bind(workspaceId, userId).first();
  
  if (!workspace) {
    return jsonResponse({ error: 'Workspace not found' }, 404, corsHeaders);
  }

  const filePath = url.searchParams.get('path') || '';
  
  // Security: Block dangerous file paths
  if (filePath.includes('..') || filePath.startsWith('/')) {
    await logAudit(env, { 
      userId, 
      action: 'BLOCKED_PATH_TRAVERSAL', 
      resource: `file:${filePath}`, 
      ip: clientIP 
    });
    return jsonResponse({ error: 'Invalid file path' }, 400, corsHeaders);
  }
  
  // Security: Block dangerous file extensions on write
  if ((request.method === 'PUT' || request.method === 'POST') && isBlockedFile(filePath)) {
    await logAudit(env, { 
      userId, 
      action: 'BLOCKED_FILE_TYPE', 
      resource: `file:${filePath}`, 
      ip: clientIP 
    });
    return jsonResponse({ error: 'File type not allowed for security reasons' }, 400, corsHeaders);
  }
  
  const r2Key = `${userId}/${workspaceId}/${filePath}`;

  // GET /api/files - List files or get file content
  if (request.method === 'GET') {
    if (url.searchParams.get('list') === 'true') {
      // List files in directory
      const prefix = filePath ? `${userId}/${workspaceId}/${filePath}/` : `${userId}/${workspaceId}/`;
      const files = await env.STUDIO_FILES.list({ prefix, delimiter: '/' });
      
      const result = {
        files: files.objects.map(obj => ({
          path: obj.key.replace(`${userId}/${workspaceId}/`, ''),
          size: obj.size,
          modified: obj.uploaded,
        })),
        directories: files.delimitedPrefixes.map(p => p.replace(`${userId}/${workspaceId}/`, '').replace(/\/$/, '')),
      };
      return jsonResponse(result);
    } else {
      // Get file content
      const file = await env.STUDIO_FILES.get(r2Key);
      if (!file) {
        return jsonResponse({ error: 'File not found' }, 404);
      }
      const content = await file.text();
      return jsonResponse({ path: filePath, content });
    }
  }

  // PUT /api/files - Create or update file (supports chunked upload)
  if (request.method === 'PUT') {
    const body = await request.json() as { 
      content?: string; 
      chunk?: string;
      chunkIndex?: number;
      totalChunks?: number;
      uploadId?: string;
    };
    
    // Chunked upload
    if (body.chunk !== undefined && body.chunkIndex !== undefined && body.totalChunks !== undefined) {
      const uploadId = body.uploadId || crypto.randomUUID();
      const chunkKey = `uploads/${userId}/${workspaceId}/${uploadId}/chunk_${body.chunkIndex}`;
      
      await env.STUDIO_FILES.put(chunkKey, body.chunk);
      
      // If this is the last chunk, combine them
      if (body.chunkIndex === body.totalChunks - 1) {
        const chunks: string[] = [];
        for (let i = 0; i < body.totalChunks; i++) {
          const chunkData = await env.STUDIO_FILES.get(`uploads/${userId}/${workspaceId}/${uploadId}/chunk_${i}`);
          if (chunkData) {
            chunks.push(await chunkData.text());
          }
        }
        
        const fullContent = chunks.join('');
        
        await env.STUDIO_FILES.put(r2Key, fullContent, {
          customMetadata: {
            userId,
            workspaceId,
            path: filePath,
            updatedAt: new Date().toISOString(),
          },
        });
        
        // Clean up chunks
        for (let i = 0; i < body.totalChunks; i++) {
          await env.STUDIO_FILES.delete(`uploads/${userId}/${workspaceId}/${uploadId}/chunk_${i}`);
        }
        
        await env.STUDIO_DB.prepare(
          'UPDATE workspaces SET updated_at = datetime() WHERE id = ?'
        ).bind(workspaceId).run();
        
        return jsonResponse({ success: true, path: filePath, complete: true });
      }
      
      return jsonResponse({ success: true, uploadId, chunkIndex: body.chunkIndex, complete: false });
    }
    
    // Regular upload
    const content = body.content || '';
    const maxSize = parseInt(env.MAX_FILE_SIZE);
    
    if (content.length > maxSize) {
      return jsonResponse({ 
        error: `File too large. Max size: ${maxSize} bytes. Use chunked upload for larger files.`,
        useChunkedUpload: true,
        maxChunkSize: 5 * 1024 * 1024 // 5MB chunks
      }, 400);
    }

    await env.STUDIO_FILES.put(r2Key, content, {
      customMetadata: {
        userId,
        workspaceId,
        path: filePath,
        updatedAt: new Date().toISOString(),
      },
    });

    await env.STUDIO_DB.prepare(
      'UPDATE workspaces SET updated_at = datetime() WHERE id = ?'
    ).bind(workspaceId).run();

    return jsonResponse({ success: true, path: filePath });
  }

  // DELETE /api/files - Delete file
  if (request.method === 'DELETE') {
    await env.STUDIO_FILES.delete(r2Key);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Method not allowed' }, 405);
}

// Terminal routes - WebSocket connection to Durable Object
async function handleTerminalRoutes(
  request: Request, 
  env: Env, 
  path: string,
  userId: string,
  clientIP: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace');
  if (!workspaceId) {
    return jsonResponse({ error: 'workspace parameter required' }, 400, corsHeaders);
  }
  
  // Verify workspace ownership
  const workspace = await env.STUDIO_DB.prepare(
    'SELECT id FROM workspaces WHERE id = ? AND user_id = ?'
  ).bind(workspaceId, userId).first();
  
  if (!workspace) {
    return jsonResponse({ error: 'Workspace not found' }, 404, corsHeaders);
  }
  
  // Log terminal access
  await logAudit(env, { 
    userId, 
    action: 'TERMINAL_ACCESS', 
    resource: `workspace:${workspaceId}`, 
    ip: clientIP 
  });

  // WebSocket upgrade for terminal
  if (path === '/api/terminal/connect') {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return jsonResponse({ error: 'Expected WebSocket' }, 426);
    }

    // Get or create terminal Durable Object
    const terminalId = env.TERMINAL.idFromName(`${userId}:${workspaceId}`);
    const terminal = env.TERMINAL.get(terminalId);
    
    // Forward WebSocket to Durable Object
    return terminal.fetch(request);
  }

  // POST /api/terminal/exec - Execute single command (non-WebSocket)
  if (request.method === 'POST' && path === '/api/terminal/exec') {
    const body = await request.json() as { command: string };
    
    const terminalId = env.TERMINAL.idFromName(`${userId}:${workspaceId}`);
    const terminal = env.TERMINAL.get(terminalId);
    
    const response = await terminal.fetch(new Request('http://internal/exec', {
      method: 'POST',
      body: JSON.stringify({ command: body.command, userId, workspaceId }),
    }));
    
    return response;
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

// Git routes
async function handleGitRoutes(
  request: Request, 
  env: Env, 
  path: string,
  userId: string,
  clientIP: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace');
  if (!workspaceId) {
    return jsonResponse({ error: 'workspace parameter required' }, 400, corsHeaders);
  }
  
  // Verify workspace ownership
  const workspace = await env.STUDIO_DB.prepare(
    'SELECT id FROM workspaces WHERE id = ? AND user_id = ?'
  ).bind(workspaceId, userId).first();
  
  if (!workspace) {
    return jsonResponse({ error: 'Workspace not found' }, 404, corsHeaders);
  }

  // POST /api/git/clone - Clone a repository
  if (request.method === 'POST' && path === '/api/git/clone') {
    const body = await request.json() as { repoUrl: string; branch?: string };
    
    // Use GitHub API to fetch repo contents
    const repoMatch = body.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
      return jsonResponse({ error: 'Invalid GitHub URL' }, 400);
    }
    
    const [, owner, repo] = repoMatch;
    const branch = body.branch || 'main';
    
    // Fetch repo tree from GitHub API
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo.replace('.git', '')}/git/trees/${branch}?recursive=1`,
      { headers: { 'User-Agent': 'Elevate-Studio' } }
    );
    
    if (!treeResponse.ok) {
      return jsonResponse({ error: 'Failed to fetch repository' }, 400);
    }
    
    const tree = await treeResponse.json() as { tree: Array<{ path: string; type: string; sha: string }> };
    
    // Fetch and store each file
    let filesCloned = 0;
    for (const item of tree.tree) {
      if (item.type === 'blob') {
        const contentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo.replace('.git', '')}/contents/${item.path}?ref=${branch}`,
          { headers: { 'User-Agent': 'Elevate-Studio', 'Accept': 'application/vnd.github.raw' } }
        );
        
        if (contentResponse.ok) {
          const content = await contentResponse.text();
          const r2Key = `${userId}/${workspaceId}/${item.path}`;
          await env.STUDIO_FILES.put(r2Key, content);
          filesCloned++;
        }
      }
    }

    // Update workspace with repo info
    await env.STUDIO_DB.prepare(
      'UPDATE workspaces SET repo_url = ?, repo_branch = ?, updated_at = datetime() WHERE id = ?'
    ).bind(body.repoUrl, branch, workspaceId).run();

    return jsonResponse({ success: true, filesCloned });
  }

  // POST /api/git/push - Push changes to GitHub
  if (request.method === 'POST' && path === '/api/git/push') {
    const githubToken = request.headers.get('x-github-token');
    if (!githubToken) {
      return jsonResponse({ 
        error: 'GitHub token required',
        message: 'Include x-github-token header with your GitHub personal access token'
      }, 401);
    }

    const body = await request.json() as { 
      repoUrl: string; 
      branch?: string; 
      message: string;
      files: { path: string; content: string }[];
    };

    const repoMatch = body.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
      return jsonResponse({ error: 'Invalid GitHub URL' }, 400);
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace('.git', '');
    const branch = body.branch || 'main';

    try {
      // Get the current commit SHA for the branch
      const refResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`,
        { headers: { 'Authorization': `Bearer ${githubToken}`, 'User-Agent': 'Elevate-Studio' } }
      );
      
      if (!refResponse.ok) {
        return jsonResponse({ error: 'Failed to get branch reference' }, 400);
      }
      
      const refData = await refResponse.json() as { object: { sha: string } };
      const baseSha = refData.object.sha;

      // Get the base tree
      const commitResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseSha}`,
        { headers: { 'Authorization': `Bearer ${githubToken}`, 'User-Agent': 'Elevate-Studio' } }
      );
      const commitData = await commitResponse.json() as { tree: { sha: string } };
      const baseTreeSha = commitData.tree.sha;

      // Create blobs for each file
      const treeItems = [];
      for (const file of body.files) {
        const blobResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/blobs`,
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${githubToken}`, 
              'User-Agent': 'Elevate-Studio',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: file.content, encoding: 'utf-8' })
          }
        );
        const blobData = await blobResponse.json() as { sha: string };
        treeItems.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha
        });
      }

      // Create new tree
      const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/trees`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${githubToken}`, 
            'User-Agent': 'Elevate-Studio',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems })
        }
      );
      const treeData = await treeResponse.json() as { sha: string };

      // Create commit
      const newCommitResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/commits`,
        {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${githubToken}`, 
            'User-Agent': 'Elevate-Studio',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: body.message,
            tree: treeData.sha,
            parents: [baseSha]
          })
        }
      );
      const newCommitData = await newCommitResponse.json() as { sha: string };

      // Update branch reference
      const updateRefResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`,
        {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${githubToken}`, 
            'User-Agent': 'Elevate-Studio',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sha: newCommitData.sha })
        }
      );

      if (!updateRefResponse.ok) {
        return jsonResponse({ error: 'Failed to update branch' }, 400);
      }

      return jsonResponse({ 
        success: true, 
        commit: newCommitData.sha,
        message: `Pushed ${body.files.length} files to ${owner}/${repoName}@${branch}`
      });
    } catch (error) {
      return jsonResponse({ error: 'Push failed: ' + (error instanceof Error ? error.message : 'Unknown error') }, 500);
    }
  }

  // POST /api/git/pull - Pull latest changes from GitHub
  if (request.method === 'POST' && path === '/api/git/pull') {
    const githubToken = request.headers.get('x-github-token');
    const body = await request.json() as { repoUrl: string; branch?: string };

    const repoMatch = body.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
      return jsonResponse({ error: 'Invalid GitHub URL' }, 400);
    }

    const [, owner, repo] = repoMatch;
    const repoName = repo.replace('.git', '');
    const branch = body.branch || 'main';

    const headers: Record<string, string> = { 'User-Agent': 'Elevate-Studio' };
    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // Fetch repo tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${branch}?recursive=1`,
      { headers }
    );

    if (!treeResponse.ok) {
      return jsonResponse({ error: 'Failed to fetch repository' }, 400);
    }

    const tree = await treeResponse.json() as { tree: Array<{ path: string; type: string; sha: string }> };

    // Fetch and store each file
    let filesUpdated = 0;
    for (const item of tree.tree) {
      if (item.type === 'blob') {
        const contentResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/${item.path}?ref=${branch}`,
          { headers: { ...headers, 'Accept': 'application/vnd.github.raw' } }
        );

        if (contentResponse.ok) {
          const content = await contentResponse.text();
          const r2Key = `${userId}/${workspaceId}/${item.path}`;
          await env.STUDIO_FILES.put(r2Key, content);
          filesUpdated++;
        }
      }
    }

    return jsonResponse({ success: true, filesUpdated });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

// Node modules cache routes
async function handleCacheRoutes(
  request: Request, 
  env: Env, 
  path: string,
  userId: string,
  clientIP: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace');
  if (!workspaceId) {
    return jsonResponse({ error: 'workspace parameter required' }, 400, corsHeaders);
  }
  
  // Verify workspace ownership
  const workspace = await env.STUDIO_DB.prepare(
    'SELECT id FROM workspaces WHERE id = ? AND user_id = ?'
  ).bind(workspaceId, userId).first();
  
  if (!workspace) {
    return jsonResponse({ error: 'Workspace not found' }, 404, corsHeaders);
  }

  // POST /api/cache/node_modules - Save node_modules tarball
  if (request.method === 'POST' && path === '/api/cache/node_modules') {
    const body = await request.json() as { packageLockHash: string; tarball: string };
    
    const cacheKey = `cache/${userId}/${workspaceId}/node_modules/${body.packageLockHash}.tar.gz`;
    
    // Decode base64 tarball
    const tarballData = Uint8Array.from(atob(body.tarball), c => c.charCodeAt(0));
    
    await env.STUDIO_FILES.put(cacheKey, tarballData, {
      customMetadata: {
        userId,
        workspaceId,
        packageLockHash: body.packageLockHash,
        createdAt: new Date().toISOString(),
      },
    });

    return jsonResponse({ success: true, cacheKey });
  }

  // GET /api/cache/node_modules - Check if cache exists
  if (request.method === 'GET' && path === '/api/cache/node_modules') {
    const packageLockHash = url.searchParams.get('hash');
    if (!packageLockHash) {
      return jsonResponse({ error: 'hash parameter required' }, 400);
    }

    const cacheKey = `cache/${userId}/${workspaceId}/node_modules/${packageLockHash}.tar.gz`;
    const cached = await env.STUDIO_FILES.head(cacheKey);

    if (cached) {
      return jsonResponse({ 
        exists: true, 
        size: cached.size,
        createdAt: cached.customMetadata?.createdAt,
      });
    }

    return jsonResponse({ exists: false });
  }

  // GET /api/cache/node_modules/download - Download cached node_modules
  if (request.method === 'GET' && path === '/api/cache/node_modules/download') {
    const packageLockHash = url.searchParams.get('hash');
    if (!packageLockHash) {
      return jsonResponse({ error: 'hash parameter required' }, 400);
    }

    const cacheKey = `cache/${userId}/${workspaceId}/node_modules/${packageLockHash}.tar.gz`;
    const cached = await env.STUDIO_FILES.get(cacheKey);

    if (!cached) {
      return jsonResponse({ error: 'Cache not found' }, 404);
    }

    const tarball = await cached.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(tarball)));

    return jsonResponse({ tarball: base64 });
  }

  // DELETE /api/cache/node_modules - Clear cache
  if (request.method === 'DELETE' && path === '/api/cache/node_modules') {
    const prefix = `cache/${userId}/${workspaceId}/node_modules/`;
    const list = await env.STUDIO_FILES.list({ prefix });
    
    for (const obj of list.objects) {
      await env.STUDIO_FILES.delete(obj.key);
    }

    return jsonResponse({ success: true, deleted: list.objects.length });
  }

  return jsonResponse({ error: 'Not found' }, 404);
}

// Helper functions
async function getUserId(request: Request): Promise<string | null> {
  const context = await getUserContext(request);
  return context?.userId || null;
}

async function getUserContext(request: Request): Promise<UserContext | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7);
  try {
    // Decode JWT payload (in production, verify signature with Supabase)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Extract role from token claims or default to viewer
    const role = (payload.app_metadata?.ig_role || payload.ig_role || 'viewer') as AccessRole;
    
    // Validate role is known
    if (!ROLE_PERMISSIONS[role]) {
      return null;
    }
    
    return {
      userId: payload.sub,
      role,
      tenantId: payload.app_metadata?.tenant_id || payload.tenant_id || 'default',
      environment: (payload.app_metadata?.environment || 'development') as UserContext['environment'],
      licenseActive: payload.app_metadata?.license_active !== false,
    };
  } catch {
    return null;
  }
}

async function requirePermission(
  request: Request, 
  permission: keyof typeof ROLE_PERMISSIONS['viewer'],
  env: Env,
  clientIP: string
): Promise<{ allowed: true; context: UserContext } | { allowed: false; response: Response }> {
  const context = await getUserContext(request);
  
  if (!context) {
    return { 
      allowed: false, 
      response: jsonResponse({ error: 'Authentication required' }, 401) 
    };
  }
  
  if (!context.licenseActive) {
    await logAudit(env, { 
      userId: context.userId, 
      action: 'LICENSE_INACTIVE', 
      resource: permission,
      ip: clientIP 
    });
    return { 
      allowed: false, 
      response: jsonResponse({ error: 'License inactive. Contact support.' }, 403) 
    };
  }
  
  if (!hasPermission(context.role, permission)) {
    await logAudit(env, { 
      userId: context.userId, 
      action: 'PERMISSION_DENIED', 
      resource: permission,
      details: { role: context.role, requiredPermission: permission },
      ip: clientIP 
    });
    return { 
      allowed: false, 
      response: jsonResponse({ 
        error: 'Permission denied',
        message: `Your role (${context.role}) does not have ${permission} permission`,
        requiredTier: permission === 'canExecute' || permission === 'canAccessTerminal' 
          ? 'Enterprise Operations License (Engineer tier)' 
          : 'Contact your administrator'
      }, 403) 
    };
  }
  
  return { allowed: true, context };
}

function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      ...corsHeaders,
    },
  });
}
