import { readFileSync } from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), 'utf8');

interface AppEnvironmentVariable {
  key: string;
  value: string;
  scope: 'RUN_TIME' | 'BUILD_TIME' | 'RUN_AND_BUILD_TIME';
  type: 'GENERAL' | 'SECRET';
}

interface AppSpec {
  name: string;
  region: string;
  services: Array<{
    name: string;
    github: { repo: string; branch: string; deploy_on_push: boolean };
    dockerfile_path: string;
    http_port: number;
    instance_count: number;
    instance_size_slug: string;
    health_check: { http_path: string };
    envs: AppEnvironmentVariable[];
  }>;
}

const expected = {
  marketing: { dockerfile: 'Dockerfile.marketing', health: '/api/ping' },
  admin: { dockerfile: 'Dockerfile.admin', health: '/api/version' },
  lms: { dockerfile: 'Dockerfile.lms', health: '/api/version' },
} as const;

describe('DigitalOcean recovery deployment contract', () => {
  for (const [serviceName, contract] of Object.entries(expected)) {
    it(`defines a guarded ${serviceName} App Platform service`, () => {
      const spec = load(source(`.do/${serviceName}.yaml`)) as AppSpec;
      const service = spec.services[0];

      expect(spec.name).toBe(`elevate-dr-${serviceName}`);
      expect(spec.region).toBe('nyc');
      expect(service.name).toBe(serviceName);
      expect(service.github).toEqual({
        repo: 'elevate-for-humanity/Elevate-lms',
        branch: 'main',
        deploy_on_push: false,
      });
      expect(service.dockerfile_path).toBe(contract.dockerfile);
      expect(service.http_port).toBe(3000);
      expect(service.instance_count).toBe(1);
      expect(service.instance_size_slug).toBe('apps-s-1vcpu-1gb-fixed');
      expect(service.health_check.http_path).toBe(contract.health);

      const secretValues = service.envs
        .filter((entry) => entry.type === 'SECRET')
        .map((entry) => entry.value);
      expect(secretValues.length).toBeGreaterThan(0);
      for (const value of secretValues) {
        expect(value).toMatch(/^\$\{[A-Z0-9_]+\}$/);
      }
    });
  }

  it('requires a manual, confirmed main-branch deployment', () => {
    const workflow = source('.github/workflows/deploy-digitalocean-recovery.yml');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toContain('\npush:');
    expect(workflow).toContain("test '${{ inputs.confirmation }}' = 'DEPLOY_BACKUP'");
    expect(workflow).toContain("test '${{ github.ref }}' = 'refs/heads/main'");
    expect(workflow).toContain('digitalocean/app_action/deploy@v2');
    expect(workflow).toContain('token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}');
    expect(workflow).toContain('app_spec_location: .do/${{ matrix.service }}.yaml');
    expect(workflow).toContain('print_build_logs: true');
    expect(workflow).toContain('print_deploy_logs: true');
  });

  it('exposes the recovery workflow through the governed Admin deployment boundary', () => {
    const panel = source('components/studio/DeployPanel.tsx');
    const route = source('apps/admin/app/api/admin/dev-studio/shell/route.ts');

    expect(panel).toContain("key: 'deploy-digitalocean-recovery'");
    expect(panel).toContain("inputs: { service: 'all', confirmation: 'DEPLOY_BACKUP' }");
    expect(panel).toContain("workflow: 'deploy-production'");
    expect(panel).not.toContain('deploy-production-dispatch');
    expect(route).toContain("'deploy-all': 'deploy-production.yml'");
    expect(route).toContain("'deploy-backup': 'deploy-digitalocean-recovery.yml'");
    expect(route).toContain("requireTypedConfirmation(body?.confirmation, 'deploy_autopilot')");
    expect(route).toContain("workflowFile === 'deploy-digitalocean-recovery.yml'");
    expect(route).toContain('GitHub could not dispatch the DigitalOcean recovery workflow');
  });
});
