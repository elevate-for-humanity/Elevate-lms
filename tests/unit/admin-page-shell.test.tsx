import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Users } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

afterEach(cleanup);
describe('operational Admin page controls', () => {
  it('exposes the supplied page identity, saved counts, and working action alongside records', () => {
    const action = vi.fn();
    render(
      <AdminPageShell
        title="Applications"
        description="Review saved applications."
        breadcrumbs={[{ label: 'Admin', href: '/dashboard' }, { label: 'Applications' }]}
        stats={[{ label: 'Needs Review', value: 57, icon: Users }]}
        actions={<button onClick={action}>Inspect records</button>}
      >
        <p>Record list</p>
      </AdminPageShell>,
    );
    expect(screen.getByRole('heading', { name: 'Applications' })).toBeTruthy();
    expect(screen.getByText('57')).toBeTruthy();
    expect(screen.getByText('Record list')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Inspect records' }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Admin' }).getAttribute('href')).toBe('/dashboard');
  });
  it('does not generate statistics when the caller has no saved metrics', () => {
    render(
      <AdminPageShell title="Records">
        <p>Unavailable data</p>
      </AdminPageShell>,
    );
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText('Unavailable data')).toBeTruthy();
  });
});
