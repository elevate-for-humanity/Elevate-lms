import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import HostShopDocumentUploadForm from '@/apps/lms/app/host-shop/onboarding/documents/HostShopDocumentUploadForm';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
afterEach(() => vi.unstubAllGlobals());

it('unlocks the same upload form after a successful submission', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
  const { container } = render(<HostShopDocumentUploadForm partnerId="test-shop" documentType="business_license" requiresExpiration={false} />);
  const form = container.querySelector('form')!;
  const reset = vi.spyOn(form, 'reset');
  fireEvent.submit(form);
  await waitFor(() => expect(reset).toHaveBeenCalledOnce());
  expect((screen.getByRole('button', { name: 'Upload' }) as HTMLButtonElement).disabled).toBe(false);
});
