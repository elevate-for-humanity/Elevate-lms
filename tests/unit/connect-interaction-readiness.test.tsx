// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import ConnectPage from '@/apps/marketing/app/connect/page';

vi.mock('@/components/ui/Breadcrumbs', () => ({ Breadcrumbs: () => null }));
afterEach(cleanup);

describe('Connect platform selection readiness', () => {
  it('disables all eight platform selectors until hydration attaches their handlers', () => {
    const document = new DOMParser().parseFromString(renderToString(<ConnectPage />), 'text/html');
    const selectors = document.querySelectorAll('button[aria-pressed]');
    expect(selectors).toHaveLength(8);
    for (const selector of selectors) expect(selector.hasAttribute('disabled')).toBe(true);
  });

  it('accepts the first ready selection and opens the real URL step', () => {
    render(<ConnectPage />);
    const wordpress = screen.getByRole('button', { name: /WordPress/ });
    expect(wordpress.hasAttribute('disabled')).toBe(false);
    fireEvent.click(wordpress);
    expect(wordpress.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Continue', exact: true }));
    expect(screen.getByLabelText(/Site URL/)).toBeTruthy();
  });
});
