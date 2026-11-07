import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('next/dynamic', () => ({ default: (loader: () => unknown) => String(loader).includes('RealRepoWorkspace')
  ? () => <input aria-label="Terminal draft" defaultValue="" /> : () => <div>Existing editor</div> }));
vi.mock('@/components/studio/RepositoryLivePreview', () => ({ default: () => <div>Preview</div> }));
import RepositoryStudioWorkspace from '@/components/studio/RepositoryStudioWorkspace';
afterEach(cleanup);
it('keeps the existing terminal mounted when switching to the editor and back', () => {
  render(<RepositoryStudioWorkspace />);
  fireEvent.click(screen.getByRole('button', { name: 'Runtime + Terminal' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Terminal draft' }), { target: { value: 'unfinished command' } });
  fireEvent.click(screen.getByRole('button', { name: 'Editor + Preview' }));
  expect(screen.getByLabelText('Terminal draft')).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Runtime + Terminal' }));
  expect(screen.getByRole('textbox', { name: 'Terminal draft' })).toHaveValue('unfinished command');
});
