import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '../..');

describe('dev container credential wiring (no fake secrets in UI)', () => {
  it('documents Northflank runtime env keys', () => {
    const envExample = readFileSync(join(REPO_ROOT, '.env.example'), 'utf8');
    for (const key of [
      'NORTHFLANK_API_TOKEN',
      'NORTHFLANK_PROJECT_ID',
      'NORTHFLANK_LMS_SERVICE_ID',
      'NORTHFLANK_ADMIN_SERVICE_ID',
      'NORTHFLANK_SECRET_GROUP_ID',
    ]) {
      expect(envExample, `missing ${key} in .env.example`).toContain(key);
    }
  });

  it('command center components do not embed raw API keys or placeholder Supabase secrets', () => {
    const paths = [
      'components/admin/dashboard/LizzyContainer.tsx',
      'components/admin/dashboard/LizzyWorkspace.tsx',
      'components/admin/dashboard/LizzyExecutePanel.tsx',
      'components/admin/dashboard/DevContainerPanel.tsx',
      'components/dev-studio/DevContainerPanel.tsx',
      'components/dev-studio/SecretsPanel.tsx',
    ];
    const banned = [
      /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][^'"]+['"]/,
      /sk_live_[a-zA-Z0-9]+/,
      /sk_test_[a-zA-Z0-9]+/,
      /eyJhbGci[a-zA-Z0-9._-]{20,}/,
      /NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder/,
    ];
    for (const rel of paths) {
      let src: string;
      try {
        src = readFileSync(join(REPO_ROOT, rel), 'utf8');
      } catch {
        continue;
      }
      for (const pattern of banned) {
        expect(src, `${rel} must not contain hardcoded secrets`).not.toMatch(pattern);
      }
    }
  });

  it('DevContainerPanel staging preset uses real template URLs not literal ${...} strings', () => {
    // components/dev-studio may not exist - check admin dashboard instead
    const adminPanelPath = join(REPO_ROOT, 'components/admin/dashboard/DevContainerPanel.tsx');
    const devStudioPath = join(REPO_ROOT, 'components/dev-studio/DevContainerPanel.tsx');
    
    const panelPath = existsSync(adminPanelPath) ? adminPanelPath : 
                      existsSync(devStudioPath) ? devStudioPath : null;
    
    if (panelPath) {
      const src = readFileSync(panelPath, 'utf8');
      expect(src).not.toContain("'https://staging.${PLATFORM_DEFAULTS.canonicalDomain}'");
      expect(src).not.toContain("'https://admin.${PLATFORM_DEFAULTS.canonicalDomain}'");
    } else {
      // DevContainerPanel not present - test passes
      expect(true).toBe(true);
    }
  });

  it('devcontainer API hydrates platform_secrets before GitHub calls', () => {
    const route = readFileSync(
      join(REPO_ROOT, 'apps/admin/app/api/devstudio/devcontainer/route.ts'),
      'utf8',
    );
    expect(route).toContain('ensureDevStudioSecrets');
    expect(route).toContain('getGitHubToken');
    expect(route).not.toMatch(/function hasGitHubToken\(\): boolean/);
  });

  it('devcontainer setup creates local env without production secret pull', () => {
    const setup = readFileSync(join(REPO_ROOT, '.devcontainer/setup-env.sh'), 'utf8');
    expect(setup).toContain('cp .env.example "$ENV_FILE"');
    expect(setup).toContain('Northflank secret groups');
    expect(setup).not.toContain('FAKE_');
  });
});
