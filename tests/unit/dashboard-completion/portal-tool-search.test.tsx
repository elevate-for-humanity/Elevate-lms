import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { PortalToolSearch } from '@/components/platform/PortalToolSearch';
const icon = () => null;
it('finds canonical role tools, deduplicates destinations and clears after navigation', () => {
  const navigate = vi.fn();
  render(
    <PortalToolSearch
      onNavigate={navigate}
      sections={[
        {
          id: 'school',
          items: [
            { id: 'roster', label: 'My students', href: '/program-holder/students', icon },
            { id: 'dupe', label: 'My students', href: '/program-holder/students', icon },
            { id: 'hours', label: 'Approve hours', href: '/program-holder/hours', icon },
          ],
        },
      ]}
    />,
  );
  const input = screen.getByRole('searchbox');
  fireEvent.change(input, { target: { value: 'students' } });
  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(1);
  expect(links[0]).toHaveAttribute('href', '/program-holder/students');
  fireEvent.click(links[0]);
  expect(navigate).toHaveBeenCalledOnce();
  expect(input).toHaveValue('');
  fireEvent.change(input, { target: { value: 'missing' } });
  expect(screen.getByRole('status').textContent).toContain('No matching tools');
  fireEvent.keyDown(input, { key: 'Escape' });
  expect(input).toHaveValue('');
});
