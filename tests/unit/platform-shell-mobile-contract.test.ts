import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const shellPath = resolve(root, 'components/platform/PlatformShell.tsx');
const shell = readFileSync(shellPath, 'utf8');

const canonicalConsumers = [
  'components/lms/LearnerWorkspaceLayout.tsx',
  'apps/lms/app/apprentice/layout.tsx',
  'apps/lms/app/employer/layout.tsx',
  'apps/lms/app/workforce/layout.tsx',
  'apps/lms/app/host-shop/dashboard/layout.tsx',
  'apps/lms/app/program-holder/dashboard/layout.tsx',
  'apps/lms/app/parent-portal/dashboard/layout.tsx',
  'apps/lms/app/parent-portal/student/layout.tsx',
];

describe('canonical portal shell mobile contract', () => {
  it('uses one shared shell across primary LMS portal roles', () => {
    for (const relativePath of canonicalConsumers) {
      const source = readFileSync(resolve(root, relativePath), 'utf8');
      expect(source, `${relativePath} must use the canonical PlatformShell`).toContain(
        '@/components/platform/PlatformShell',
      );
    }
  });

  it('renders dashboard content immediately instead of waiting for hydration', () => {
    expect(shell).not.toContain('const [mounted');
    expect(shell).not.toContain('mounted ?');
    expect(shell).toContain('{children}');
  });

  it('keeps the mobile drawer and overlay above the sticky header', () => {
    expect(shell).toContain('z-50');
    expect(shell).toContain('z-[60]');
    expect(shell).toContain('z-[70]');
    expect(shell).toContain('aria-controls="portal-navigation-drawer"');
    expect(shell).toContain('aria-modal={sidebarOpen ? true : undefined}');
  });

  it('locks document scrolling and supports keyboard dismissal while the drawer is open', () => {
    expect(shell).toContain("document.body.style.overflow = 'hidden'");
    expect(shell).toContain('document.body.style.overflow = previousOverflow');
    expect(shell).toContain("event.key === 'Escape'");
    expect(shell).toContain('menuButtonRef.current?.focus()');
  });

  it('traps keyboard focus inside the open mobile drawer', () => {
    expect(shell).toContain('const drawerRef = useRef<HTMLElement>(null)');
    expect(shell).toContain("event.key !== 'Tab'");
    expect(shell).toContain('drawerRef.current.querySelectorAll<HTMLElement>');
    expect(shell).toContain('event.preventDefault()');
  });

  it('protects mobile layouts from page-level horizontal overflow and unsafe fixed widths', () => {
    expect(shell).toContain('min-h-dvh');
    expect(shell).toContain('overflow-x-clip');
    expect(shell).toContain('w-[min(20rem,calc(100vw-2.5rem))]');
    expect(shell).toContain('overflow-x-auto whitespace-nowrap');
    expect(shell).toContain('max-w-full overflow-x-auto break-words');
  });

  it('enforces touch-sized navigation controls and links', () => {
    expect(shell).toContain('min-h-11 min-w-11');
    expect(shell).toContain('flex min-h-11 items-center');
  });
});
