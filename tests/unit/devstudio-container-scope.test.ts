import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Dev Studio container scope', () => {
  it('reports configuration capabilities without claiming runtime provisioning', () => {
    const route = read('apps/admin/app/api/admin/dev-studio/devcontainer/route.ts');
    expect(route).toContain('canCommit: true');
    expect(route).toContain('canProvisionWorkspace: false');
    expect(route).toContain('canStartInteractiveSession: false');
  });

  it('labels the UI as a control plane rather than an interactive container', () => {
    const panel = read('components/studio/DevContainerPanel.tsx');
    const page = read('apps/admin/app/studio/containers/page.tsx');
    expect(panel).toContain('Container configuration & deployments');
    expect(panel).toContain('does not provision an isolated workspace or start an interactive container session');
    expect(page).toContain('Loading container control plane');
  });
});
