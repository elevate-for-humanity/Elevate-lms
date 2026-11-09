import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import StudentApplicationForm from '@/apps/marketing/app/apply/student/StudentApplicationForm';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
beforeEach(() => { localStorage.clear(); vi.stubGlobal('scrollTo', vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('saves each step without interrupting the active application or submitting on entry to review', () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  render(<StudentApplicationForm />);
  for (const [label, value] of Object.entries({ 'First Name':'Test', 'Last Name':'Applicant', 'Date of Birth':'1990-01-01', Email:'test@example.com', Phone:'2025550147', 'Street Address':'123 Test St', City:'Indianapolis', 'ZIP Code':'46226' })) {
    fireEvent.change(screen.getByLabelText(label, { exact:true }), { target: { value } });
  }
  fireEvent.click(screen.getByRole('button', { name:'Continue' }));
  expect(screen.queryByText('You have a saved application')).toBeNull();
  fireEvent.change(screen.getByRole('combobox', { name:'Program of Interest *' }), { target:{ value:'hvac-technician' } });
  fireEvent.click(screen.getByRole('button', { name:'Continue' }));
  fireEvent.change(screen.getByRole('combobox', { name:'How do you plan to pay? *' }), { target:{ value:'self_pay' } });
  fireEvent.click(screen.getByRole('button', { name:'Continue' }));
  const continueButton = screen.getByRole('button', { name:'Continue' });
  fireEvent.click(continueButton);
  expect(screen.getByRole('heading', { name:'Review and certify' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name:'Submit Intake Application' })).not.toBe(continueButton);
  expect(screen.queryByText('Confirm the application certification and information-verification consent before submitting.')).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
