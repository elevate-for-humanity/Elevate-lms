import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EmailDirectory } from '@/components/communications/EmailDirectory';

afterEach(cleanup);
const rows = [
  {
    id: 'active/id',
    displayName: 'Admissions',
    address: 'admissions@elevateforhumanity.org',
    mailboxKind: 'organization',
    active: true,
    members: ['Debbie'],
  },
  {
    id: 'inactive',
    displayName: 'Old office',
    address: 'old@elevateforhumanity.org',
    mailboxKind: 'individual',
    active: false,
    members: [],
  },
];
describe('email directory on phones and desktops', () => {
  it('keeps active-only filtering and mailbox destinations consistent in both layouts', () => {
    const { container } = render(<EmailDirectory rows={rows} openHrefBase="/inbox" />);
    expect(screen.queryByText('Old office')).not.toBeInTheDocument();
    const phone = screen.getByRole('list', { name: 'Mailboxes' });
    expect(within(phone).getByRole('link')).toHaveAttribute('href', '/inbox?mailboxId=active%2Fid');
    expect(container.querySelector('table a')).toHaveAttribute(
      'href',
      '/inbox?mailboxId=active%2Fid',
    );
    expect(within(phone).getByText('Type')).toBeInTheDocument();
    expect(within(phone).getByText('Debbie')).toBeInTheDocument();
  });
  it('searches members and shows inactive mailboxes without making them clickable', () => {
    render(<EmailDirectory rows={rows} />);
    const search = screen.getByRole('textbox', { name: 'Search mailboxes' });
    fireEvent.change(search, { target: { value: 'Debbie' } });
    expect(within(screen.getByRole('list')).getByText('Admissions')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'Old office' } });
    expect(screen.getByText('No mailboxes match this view.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show inactive' }));
    expect(within(screen.getByRole('list')).getByText('Old office')).toBeInTheDocument();
    expect(within(screen.getByRole('list')).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText('No mailboxes match this view.')).not.toBeInTheDocument();
  });
});
