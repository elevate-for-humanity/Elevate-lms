import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { VideoCallingGuide } from '@/components/communications/VideoCallingGuide';
afterEach(cleanup);
it('lets users follow all nine steps, go back, and restart without joining a call', () => {
  render(<VideoCallingGuide />);
  expect(screen.getByRole('heading', { name: '1. Find or schedule your meeting' })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);
  for (let index = 1; index < 9; index++) fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByRole('heading', { name: '9. Fix a connection problem' })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  expect(screen.getByRole('heading', { name: '8. Leave when finished' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
  expect(screen.getByRole('heading', { name: '1. Find or schedule your meeting' })).toBeTruthy();
});
