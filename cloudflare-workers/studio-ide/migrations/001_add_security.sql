-- Migration: Add security tables and columns for IG
-- Version: 2.0.0

-- Tenants (licensed organizations)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  license_tier TEXT NOT NULL DEFAULT 'managed',
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
  role TEXT NOT NULL DEFAULT 'viewer',
  environment TEXT NOT NULL DEFAULT 'development',
  granted_by TEXT,
  granted_at TEXT DEFAULT (datetime('now')),
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles(tenant_id);

-- Add tenant_id to workspaces if not exists
ALTER TABLE workspaces ADD COLUMN tenant_id TEXT DEFAULT 'default';
ALTER TABLE workspaces ADD COLUMN environment TEXT DEFAULT 'development';

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  environment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Add environment to terminal_history
ALTER TABLE terminal_history ADD COLUMN environment TEXT DEFAULT 'development';

-- Kill switch / access revocation
CREATE TABLE IF NOT EXISTS access_revocations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  reason TEXT NOT NULL,
  revoked_by TEXT NOT NULL,
  revoked_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_revocations_tenant ON access_revocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revocations_user ON access_revocations(user_id);

-- Insert default tenant
INSERT OR IGNORE INTO tenants (id, name, license_tier, license_active) 
VALUES ('default', 'Development', 'restricted_source', 1);
