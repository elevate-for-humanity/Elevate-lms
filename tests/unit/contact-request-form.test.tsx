import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ContactRequestForm } from '@/components/forms/ContactRequestForm';

afterEach(cleanup);

it('keeps native form delivery and exposes persistent feedback after required-field validation', () => {
  render(<ContactRequestForm><label>Email<input name="email" type="email" required /></label><button type="submit">Send Message</button></ContactRequestForm>);
  const input = screen.getByRole('textbox', { name: 'Email' });
  const form = input.closest('form')!;
  expect(form).toHaveAttribute('action', '/api/contact');
  expect(form).toHaveAttribute('method', 'post');
  expect(form.checkValidity()).toBe(false);
  fireEvent.invalid(input);
  expect(screen.getByRole('alert')).toHaveTextContent('Please complete each required field');
  fireEvent.input(input, { target: { value: 'audit@example.test' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(form.checkValidity()).toBe(true);
});
