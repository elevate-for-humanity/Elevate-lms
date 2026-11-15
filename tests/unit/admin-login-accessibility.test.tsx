import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AdminLoginForm from '../../apps/admin/app/login/LoginForm';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));
afterEach(cleanup);

it('names credential fields and preserves the password reset transition', () => {
  render(<AdminLoginForm />);
  const email = screen.getByLabelText('Email') as HTMLInputElement;
  const password = screen.getByLabelText('Password') as HTMLInputElement;
  expect(email).toHaveAttribute('autocomplete', 'email');
  expect(password).toHaveAttribute('autocomplete', 'current-password');
  fireEvent.change(email, { target: { value: 'admin@example.org' } });
  fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
  expect(screen.getByLabelText('Email')).toHaveValue('admin@example.org');
  expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'admin-reset-email');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel — back to sign in' }));
  expect(screen.getByLabelText('Email')).toHaveValue('admin@example.org');
  expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
});
