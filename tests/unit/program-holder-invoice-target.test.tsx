import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ProgramHolderDocumentUpload } from '@/components/program-holder/ProgramHolderDocumentUpload';
afterEach(cleanup);
it('keeps invoice certification required and gives its control a 44px touch target', () => {
  render(<ProgramHolderDocumentUpload invoiceOnly />);
  const checkbox = screen.getByRole('checkbox', { name: /I certify that these services/ });
  expect(checkbox).toBeRequired();
  expect(checkbox).toHaveClass('h-11', 'w-11');
  expect(checkbox.closest('label')).toHaveClass('min-h-11', 'cursor-pointer');
});
