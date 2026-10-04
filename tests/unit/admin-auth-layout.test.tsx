import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminApplicationChrome } from '@/components/admin/AdminApplicationChrome';

const route = vi.hoisted(() => ({ pathname: '/login' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));
vi.mock('@/components/admin/AdminNavShell', () => ({
  AdminNavShell: () => <header>Dashboard navigation</header>,
}));
vi.mock('@/components/admin/AdminMobileDock', () => ({
  AdminMobileDock: () => <nav aria-label="Mobile admin navigation">Dashboard dock</nav>,
}));

describe('Admin authentication layout', () => {
  it.each(['/login', '/auth/reset-password'])(
    'keeps %s free of dashboard navigation that can cover mobile credentials',
    (pathname) => {
      route.pathname = pathname;
      const html = renderToStaticMarkup(
        <AdminApplicationChrome navSections={[]}><form>Sign-in form</form></AdminApplicationChrome>,
      );
      expect(html).toContain('Sign-in form');
      expect(html).toContain('data-elevate-auth-shell');
      expect(html).not.toContain('Dashboard navigation');
      expect(html).not.toContain('Dashboard dock');
    },
  );

  it('retains dashboard navigation on ordinary authenticated documents', () => {
    route.pathname = '/dashboard';
    const html = renderToStaticMarkup(
      <AdminApplicationChrome navSections={[]}>Dashboard content</AdminApplicationChrome>,
    );
    expect(html).toContain('Dashboard navigation');
    expect(html).toContain('Dashboard dock');
  });

  it.each(['/studio', '/studio/browser'])('preserves the full-screen %s workspace', (pathname) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(
      <AdminApplicationChrome navSections={[]}>Studio content</AdminApplicationChrome>,
    );
    expect(html).toContain('data-elevate-dashboard-shell="studio"');
    expect(html).not.toContain('Dashboard navigation');
    expect(html).not.toContain('Dashboard dock');
  });
});
