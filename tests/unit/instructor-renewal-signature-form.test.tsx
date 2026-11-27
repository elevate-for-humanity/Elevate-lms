import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ sign: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: m.push }) }));
vi.mock('@/apps/marketing/app/actions/sign-agreement', () => ({ signAgreement: m.sign }));
vi.mock('signature_pad', () => ({ default: class {} }));
import { DocumentSignatureBlock } from '@/components/documents/DocumentSignatureBlock';
beforeEach(() => { m.sign.mockReset().mockResolvedValue({ success: false, error: 'Test stops before navigation' }); });
it('submits the displayed revocation context with a new acknowledgment', async () => {
  render(<DocumentSignatureBlock agreementType="instructor_curriculum_ip" renewalLicenseId="revoked-1" />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Full legal name' }), { target: { value: 'QA Instructor' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Sign & Continue' }));
  await waitFor(() => expect(m.sign).toHaveBeenCalledWith(expect.objectContaining({
    renewalLicenseId: 'revoked-1', agreementVersion: '1.0', typedName: 'QA Instructor',
  })));
});
it('clears an old acknowledgment and signature when the revocation context changes', () => {
  const props = { agreementType: 'instructor_curriculum_ip', renewalLicenseId: 'revoked-1' };
  const { rerender } = render(<DocumentSignatureBlock {...props} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Full legal name' }), { target: { value: 'QA Instructor' } });
  fireEvent.click(screen.getByRole('checkbox'));
  expect(screen.getByRole('button', { name: 'Sign & Continue' })).toBeEnabled();
  rerender(<DocumentSignatureBlock {...props} renewalLicenseId="revoked-2" />);
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(screen.getByRole('textbox', { name: 'Full legal name' })).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Sign & Continue' })).toBeDisabled();
});
