import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { resolveRoleCompatiblePostLoginUrl } from '@/lib/auth/post-login-redirect';
import { getRoleDestinationUrl } from '@/lib/auth/role-destinations';
import { AdminApplicationChrome } from '@/components/admin/AdminApplicationChrome';
import { getNavigationForRole } from '@/lib/navigation/navigation-config';

const state = vi.hoisted(() => ({ pathname: '/staff-portal/dashboard' }));
vi.mock('next/navigation', () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/admin/AdminNavShell', () => ({
  AdminNavShell: () => <div>Administrator menu</div>,
}));
vi.mock('@/components/admin/AdminMobileDock', () => ({
  AdminMobileDock: () => <div>Administrator dock</div>,
}));
vi.mock('@/components/communications/CommunicationTodos', () => ({
  CommunicationTodos: () => <div>Administrator inbox</div>,
}));
vi.mock('@/components/communications/DashboardVideoCalls', () => ({
  DashboardVideoCalls: () => null,
}));
afterEach(cleanup);

describe('separate staff and learner workspaces', () => {
  it('keeps staff tools in the staff portal and course links in the learner portal', () => {
    const staffLinks = getNavigationForRole('staff').flatMap(section => section.items);
    expect(staffLinks.every(item => new URL(item.href).pathname.startsWith('/staff-portal'))).toBe(true);
    const learnerCourses = getNavigationForRole('student').flatMap(section => section.items).find(item => item.id === 'courses');
    expect(new URL(learnerCourses!.href).pathname).toBe('/lms/courses');
  });
  it('preserves an assigned learner course destination for a dual-role staff member', () => {
    const learner = new URL(getRoleDestinationUrl('student'));
    const course = `${learner.origin}/lms/courses/assigned-course`;
    expect(resolveRoleCompatiblePostLoginUrl(course, 'staff', ['staff', 'student'])).toBe(course);
  });
  it('does not grant learner routing from staff membership alone', () => {
    const course = new URL(
      '/lms/courses/assigned-course',
      getRoleDestinationUrl('student'),
    ).toString();
    expect(resolveRoleCompatiblePostLoginUrl(course, 'staff', ['staff'])).toBe(
      getRoleDestinationUrl('staff'),
    );
  });
  it('does not let a student return into the staff workspace', () => {
    expect(
      resolveRoleCompatiblePostLoginUrl('/staff-portal/dashboard', 'student', ['student']),
    ).toBe(getRoleDestinationUrl('student'));
  });
  it('does not mount privileged administrator navigation or inbox around staff pages', () => {
    render(
      <AdminApplicationChrome navSections={[]}>
        <p>Staff records</p>
      </AdminApplicationChrome>,
    );
    expect(screen.getByText('Staff records')).toBeTruthy();
    expect(screen.queryByText('Administrator menu')).toBeNull();
    expect(screen.queryByText('Administrator dock')).toBeNull();
    expect(screen.queryByText('Administrator inbox')).toBeNull();
  });
});
