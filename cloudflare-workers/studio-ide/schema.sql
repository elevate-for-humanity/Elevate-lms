-- D1 Schema for IG - Licensed Platform Operations Console
-- Version: 2.0.0

-- Tenants (licensed organizations)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  license_tier TEXT NOT NULL DEFAULT 'managed', -- managed, enterprise, restricted_source
  license_active INTEGER DEFAULT 1,
  license_expires_at TEXT,
  settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- User roles within tenants
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- viewer, operator, engineer, admin
  environment TEXT NOT NULL DEFAULT 'development', -- development, staging, production
  granted_by TEXT,
  granted_at TEXT DEFAULT (datetime('now')),
  revoked_at TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(user_id, tenant_id, environment)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);

-- Workspaces (scoped to tenant)
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  repo_branch TEXT DEFAULT 'main',
  environment TEXT NOT NULL DEFAULT 'development',
  settings TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_tenant ON workspaces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_updated ON workspaces(updated_at DESC);

-- File metadata (actual content in R2)
CREATE TABLE IF NOT EXISTS file_metadata (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  path TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  mime_type TEXT,
  checksum TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE(workspace_id, path)
);

CREATE INDEX IF NOT EXISTS idx_files_workspace ON file_metadata(workspace_id);

-- Audit log (persistent, queryable)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  environment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Terminal command history (for compliance)
CREATE TABLE IF NOT EXISTS terminal_history (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  command TEXT NOT NULL,
  exit_code INTEGER,
  duration_ms INTEGER,
  environment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_terminal_workspace ON terminal_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_terminal_user ON terminal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_terminal_created ON terminal_history(created_at DESC);

-- Kill switch / access revocation
CREATE TABLE IF NOT EXISTS access_revocations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  reason TEXT NOT NULL,
  revoked_by TEXT NOT NULL,
  revoked_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT -- NULL = permanent
);

CREATE INDEX IF NOT EXISTS idx_revocations_tenant ON access_revocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revocations_user ON access_revocations(user_id);

-- Insert default tenant for development
INSERT OR IGNORE INTO tenants (id, name, license_tier, license_active) 
VALUES ('default', 'Development', 'restricted_source', 1);
