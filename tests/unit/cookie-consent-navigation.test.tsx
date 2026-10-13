import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CookieConsent from '@/components/CookieConsent';

const updateConsent = vi.hoisted(() => vi.fn());
vi.mock('@/components/analytics/google-analytics', () => ({ updateConsent }));

describe('cookie preferences and page navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    document.cookie = 'cookie-consent=; Max-Age=0; path=/';
    updateConsent.mockClear();
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  it('does not steal focus from an enrollment button or intercept its Escape key', () => {
    render(<><button>Apply for apprenticeship</button><CookieConsent /></>);
    const apply = screen.getByRole('button', { name: 'Apply for apprenticeship' });
    apply.focus();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', { name: 'Necessary only' })).toBeInTheDocument();
    expect(document.activeElement).toBe(apply);
    fireEvent.keyDown(apply, { key: 'Escape' });
    expect(localStorage.getItem('cookie-consent')).toBeNull();
    expect(updateConsent).not.toHaveBeenCalledWith(true, true);
  });

  it('saves necessary-only consent and disables optional tracking', () => {
    render(<CookieConsent />);
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: 'Necessary only' }));
    expect(localStorage.getItem('cookie-consent')).toBe('rejected');
    expect(updateConsent).toHaveBeenCalledWith(false, false);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('only enables optional tracking after an affirmative acceptance', () => {
    render(<CookieConsent />);
    act(() => vi.advanceTimersByTime(1000));
    expect(updateConsent).not.toHaveBeenCalledWith(true, true);
    fireEvent.click(screen.getByRole('button', { name: 'Accept optional cookies' }));
    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
    expect(updateConsent).toHaveBeenCalledWith(true, true);
  });
});
